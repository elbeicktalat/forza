import frappe


def calculate_customer_credit_limit(customer_name):
	print(customer_name)
	credit_limit_settings = frappe.get_doc('Credit Limit Settings')
	today = frappe.utils.getdate()

	WEEK_COUNT = credit_limit_settings.weeks

	weeks = []
	for i in range(WEEK_COUNT):
		day = frappe.utils.add_days(today, -7 * i)
		weeks.append(day)

	doc = frappe.get_doc("Customer", customer_name)
	payment_entries = []
	total_paid_amount = 0
	weeks_with_balance = 0
	unique_payment_entries = []

	for week in weeks:
		balance = frappe.call(
			'erpnext.accounts.utils.get_balance_on', date=week,
			party_type="Customer", party=doc.name
		)
		if balance > 0:
			entries = frappe.db.get_list(
				'Payment Entry',
				fields=['name', 'paid_amount'],
				filters=[
					['party', '=', doc.name],
					['posting_date', 'between', (frappe.utils.add_days(week, -7), week)]
				]
			)
			payment_entries.extend(entries)
			weeks_with_balance = weeks_with_balance + 1

	for payment in payment_entries:
		is_present = payment in unique_payment_entries
		if not is_present:
			unique_payment_entries.append(payment)

	for payment in unique_payment_entries:
		total_paid_amount = total_paid_amount + payment.paid_amount
		print(payment)

	# media dei pagamenti in week
	payment_average = total_paid_amount / (
		weeks_with_balance if weeks_with_balance else 1)  # if to avoid / by zero
	doc.payment_average = payment_average

	if payment_average < 500:
		doc.credit_limit = 0
		doc.save()
		frappe.db.commit()
		return

	query_results = []
	reversed_rate = credit_limit_settings.values[::-1]
	for rata in reversed_rate:
		if payment_average >= rata.weekly_payment:
			query_results.append(rata)
	credit_limit = query_results[0].max_credit
	doc.credit_limit = credit_limit
	doc.save()
	frappe.db.commit()


def calculate_customers_credit_limit():
	customers_names = frappe.db.get_list('Customer')

	for customer_name in customers_names:
		calculate_customer_credit_limit(customer_name)
