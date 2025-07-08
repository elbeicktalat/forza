import frappe
from frappe import _, msgprint, qb


def validate_sales_order(self, arg):
	balance = frappe.call(
		"erpnext.accounts.utils.get_balance_on",
		date=self.transaction_date,
		party_type="Customer",
		party=self.customer,
		company=self.company,
	)

	self.customer_balance = balance


def before_insert_sales_order(self, arg):
	sales_team = frappe.db.sql(f'''
	select sales_person, allocated_percentage
	from `tabSales Team`
	where parenttype = 'Customer' and parent = '{self.customer}';
	''')

	employee = frappe.get_doc('Employee', sales_team[0][0])

	self.branch = employee.branch

	if self.branch:
		branch = frappe.get_doc('Branch', self.branch)
		if branch.enabled:
			self.set_warehouse = branch.main_warehouse
		else:
			frappe.throw(f"Branch {self.branch} is not active. Please select an active branch.")


def on_submit_sales_order(self, arg):
	customer = frappe.get_doc('Customer', self.customer)
	customer_balance = frappe.call(
		"erpnext.accounts.utils.get_balance_on",
		date=self.transaction_date,
		party_type="Customer",
		party=self.customer,
		company=self.company,
	)
	customer_outstanding = customer_balance + self.grand_total
	if customer.credit_limit >= customer_outstanding:
		return

	message = _("Credit limit has been crossed for customer {0} by ({1}/{2})").format(
		self.customer, customer_outstanding, customer.credit_limit
	)
	message += "<br><br>"
	message += _(
		"Please note that your paying average is ({0}) and your promise is ({1})").format(
		customer.payment_average, customer.promised_payment
	)
	message += "<br><br>"
	message += _("You have to pay <b>({0})</b> to proceed with this order").format(
		customer_outstanding - customer.credit_limit
	)

	frappe.msgprint(
		message,
		title=_("Credit Limit Crossed"),
		raise_exception=1
	)


def before_insert_delivery_note(self, arg):
	if self.is_return:
		self.naming_series = 'DN-RET-.YYYY.-'

	sales_team = frappe.db.sql(f'''
		select sales_person, allocated_percentage
		from `tabSales Team`
		where parenttype = 'Customer' and parent = '{self.customer}';
	''')

	employee = frappe.get_doc('Employee', sales_team[0][0])

	self.branch = employee.branch


def before_insert_sales_invoice(self, arg):
	if self.is_return:
		self.naming_series = 'SINV-RET-.YYYY.-'
		self.update_billed_amount_in_sales_order = True

	sales_team = frappe.db.sql(f'''
		select sales_person, allocated_percentage
		from `tabSales Team`
		where parenttype = 'Customer' and parent = '{self.customer}';
	''')

	employee = frappe.get_doc('Employee', sales_team[0][0])

	self.branch = employee.branch


def validate_sales_invoice(self, arg):
	balance = frappe.call(
		"erpnext.accounts.utils.get_balance_on",
		date=self.posting_date,
		party_type="Customer",
		party=self.customer,
		company=self.company,
	)

	self.customer_balance = balance


def on_submit_payment_entry(self, arg):
	if self.party_type != 'Customer':
		return

	frappe.call('forza.tasks.calculate_customer_credit_limit', customer_name=self.party)
	print('-------------------Ciao-----------')