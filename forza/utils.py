import frappe

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
    select
        sales_person, allocated_percentage
    from
        `tabSales Team`
    where
        parenttype = 'Customer' and parent = '{self.customer}';
    ''');

    employee = frappe.get_doc('Employee', sales_team[0][0])

    self.branch = employee.branch

    if self.branch:
        branch = frappe.get_doc('Branch', self.branch)
        if branch.is_active:
            self.set_warehouse = branch.main_warehouse
        else:
            frappe.throw(f"Branch {self.branch} is not active. Please select an active branch.")

def before_insert_delivery_note(self, arg):
    sales_team = frappe.db.sql(f'''
    select
        sales_person, allocated_percentage
    from
        `tabSales Team`
    where
        parenttype = 'Customer' and parent = '{self.customer}';
    ''');

    employee = frappe.get_doc('Employee', sales_team[0][0])

    self.branch = employee.branch

def before_insert_sales_invoice(self, arg):
    sales_team = frappe.db.sql(f'''
    select
        sales_person, allocated_percentage
    from
        `tabSales Team`
    where
        parenttype = 'Customer' and parent = '{self.customer}';
    ''');

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