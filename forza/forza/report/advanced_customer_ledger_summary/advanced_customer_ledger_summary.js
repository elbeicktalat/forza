// Copyright (c) 2025, Talat El Beick and contributors
// For license information, please see license.txt

frappe.query_reports["Advanced Customer Ledger Summary"] = {
	filters: [
		{
			fieldname: "company",
			label: __("Company"),
			fieldtype: "Link",
			options: "Company",
			default: frappe.defaults.get_user_default("Company"),
		},
		{
			fieldname: "from_date",
			label: __("From Date"),
			fieldtype: "Date",
			default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			reqd: 1,
			width: "60px",
		},
		{
			fieldname: "to_date",
			label: __("To Date"),
			fieldtype: "Date",
			default: frappe.datetime.get_today(),
			reqd: 1,
			width: "60px",
		},
		{
			fieldname: "finance_book",
			label: __("Finance Book"),
			fieldtype: "Link",
			options: "Finance Book",
		},
		{
			fieldname: "party",
			label: __("Customer"),
			fieldtype: "Link",
			options: "Customer",
			on_change: () => {
				var party = frappe.query_report.get_filter_value("party");
				if (party) {
					frappe.db.get_value("Customer", party, ["tax_id", "customer_name"], function (value) {
						frappe.query_report.set_filter_value("tax_id", value["tax_id"]);
						frappe.query_report.set_filter_value("customer_name", value["customer_name"]);
					});
				} else {
					frappe.query_report.set_filter_value("tax_id", "");
					frappe.query_report.set_filter_value("customer_name", "");
				}
			},
		},
		{
			fieldname: "customer_group",
			label: __("Customer Group"),
			fieldtype: "Link",
			options: "Customer Group",
		},
		{
			fieldname: "payment_terms_template",
			label: __("Payment Terms Template"),
			fieldtype: "Link",
			options: "Payment Terms Template",
		},
		{
			fieldname: "territory",
			label: __("Territory"),
			fieldtype: "Link",
			options: "Territory",
		},
		{
			fieldname: "sales_partner",
			label: __("Sales Partner"),
			fieldtype: "Link",
			options: "Sales Partner",
		},
		{
			fieldname: "sales_person",
			label: __("Sales Person"),
			fieldtype: "Link",
			options: "Sales Person",
		},
		{
			fieldname: "tax_id",
			label: __("Tax Id"),
			fieldtype: "Data",
			hidden: 1,
		},
		{
			fieldname: "customer_name",
			label: __("Customer Name"),
			fieldtype: "Data",
			hidden: 1,
		},
	],
	body: function(wrapper) {
		console.log(wrapper);
        // ... report rendering logic ...

        // Add a guide element
        $(wrapper).append("<div class='report-guide'>This is a helpful guide for the report.</div>");
    },
	formatter: function (value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);

		if (column.fieldname === "party" && data && data.payment_average < 500) {
			value = "<div style='display: flex; align-items: baseline'>" +
				"<button style='background:black; width: 10px; height: 10px; border-radius: 99px; padding: 0; border: none;'" + "value='" + data.party + "' onclick='createPaymentEntry(this.value)'></button>" + "<div style='width: 18px;'></div>"
				+ value +
				"</div>";
		} else if (column.fieldname === "party" && data && data.payment_average >= 500) {
			if (data.available_credit > 1500) {
				value = "<div style='display: flex; align-items: baseline'>" +
					"<button style='background:green; width: 10px; height: 10px; border-radius: 99px; padding: 0; border: none;'" + "value='" + data.party + "' onclick='createSalesOrder(this.value)'></button>" + "<div style='width: 18px;'></div>"
					+ value +
					"</div>";
			} else if (data.payment_average >= data.promised_payment) {
				value = "<div style='display: flex; align-items: baseline'>" +
					"<button style='background:orange; width: 10px; height: 10px; border-radius: 99px; padding: 0; border: none;'" + "value='" + data.party + "' onclick='createPaymentEntry(this.value)'></button>" + "<div style='width: 18px;'></div>"
					+ value +
					"</div>";
			} else {
				value = "<div style='display: flex; align-items: baseline'>" +
					"<button style='background:red; width: 10px; height: 10px; border-radius: 99px; padding: 0; border: none;'" + "value='" + data.party + "' onclick='createPaymentEntry(this.value)'></button>" + "<div style='width: 18px;'></div>"
					+ value +
					"</div>";
			}
		}


		if (column.fieldname === "party" && data && data.paid_amount > data.previous_amount) {
			value = "<span>" + value + "&#129033" + "</span>";
		} else if (column.fieldname === "party" && data && data.paid_amount < data.previous_amount) {
			value = "<span>" + value + "&#129035" + "</span>";
		}

		if (column.fieldname === "party" && data && data.payment_average < data.promised_payment && data.payment_average >= 500) {
			value = "<span style='color:red'>" + value + "?" + "</span>";
		} else if (column.fieldname === "party" && data && data.payment_average < data.promised_payment) {
			value = "<span style='color:red'>" + value + "!" + "</span>";
		} else if (column.fieldname === "party" && data && data.payment_average >= data.promised_payment && data.payment_average >= 500) {
			value = "<span style='color:red'>" + value + "@" + "</span>";
		}

		if (column.fieldname === "paid_amount" && data && data.paid_amount == 0) {
			value = "<span style='color:red'>" + value + "</span>";
		}

		if (column.fieldname === "expected_payment" && data && data.expected_payment > data.payment_average) {
			value = "<span style='color:red'>" + value + "</span>";
		} else if (column.fieldname === "expected_payment" && data && data.expected_payment <= data.payment_average) {
			value = "<span style='color:green'>" + value + "</span>";
		}

		if (column.fieldname === "promised_payment" && data && data.promised_payment < 500) {
			value = "<button style='color:red; border:none; background: transparent; padding: 0;'>" + value + "</button>";
		} else if (column.fieldname === "promised_payment" && data && data.payment_average >= data.promised_payment && data.payment_average >= 500) {
			value = "<button style='color:green; border:none; background: transparent; padding: 0;'" + "onclick='show_promised_payment_test_dialog(" + data.payment_average + "," + data.closing_balance + ")' >" + value + "</button>";
		}


		if (column.fieldname === "available_credit" && data && data.available_credit < 0) {
			value = "<span style='color:red'>" + value + "</span>";
		} else if (column.fieldname === "available_credit" && data && data.available_credit > 0) {
			value = "<span style='color:green'>" + value + "</span>";
		}

		if (column.fieldname === "payment_average" && data && data.payment_average < data.promised_payment) {
			value = "<button style='color:red; border:none; background: transparent; padding: 0;'" + "onclick='show_available_credit_test_dialog(" + data.payment_average + "," + data.closing_balance + ")' >" + value + "</button>";
		} else if (column.fieldname === "payment_average" && data && data.payment_average >= data.promised_payment) {
			value = "<button style='color:green; border:none; background: transparent; padding: 0;'" + "onclick='show_available_credit_test_dialog(" + data.payment_average + "," + data.closing_balance + ")' >" + value + "</button>";
		}

		if (column.fieldname === "payment_average" && data) {
			if (data.paid_amount > data.previous_amount) {
				value = "<div style='display: flex; align-items: baseline; justify-content: space-between;'>"
					+ "<div style='color:green;'>" + "&#129033;" + "</div>"
					+ value +
					"</div>";
			} else if (data.paid_amount < data.previous_amount) {
				value = "<div style='display: flex; align-items: baseline; justify-content: space-between;'>"
					+ "<div style='color:red;'>" + "&#129035;" + "</div>"
					+ value +
					"</div>";
			}
		}
//
//		if (column.fieldname === "party" && data && data.party == 'Top Man') {
//			value = "<span style='color:green'>" + value + "</span>";
//		}

		return value;
	},
	onload: function (report) {

//		console.log(report);
//		const today = frappe.datetime.get_today();
//
//		report['data'].forEach(data => {
//			let total_paid_amount = 0
//			console.log(data['party']);
//
//			let response = await frappe.call({
//				method: 'frappe.client.get_list',
//				args: {
//					'doctype': 'Payment Entry',
//					'fields': ['paid_amount'],
//					'filters': [
//						['party', '=', data['party']],
//						['posting_date', 'between', [frappe.datetime.add_months(today, -2), frappe.datetime.add_months(today, -1)]]
//					],
//				},
//			});
//
//			response['message'].forEach(paymentEntey => {
//				total_paid_amount += paymentEntey['paid_amount'];
//			});
//
//			prev_month_total_paid_amount.set(data['party'], total_paid_amount)
//		});
//
//		console.log(prev_month_total_paid_amount)
	}
};

const host = window.location.protocol + "//" + window.location.host;
const createPaymentEntry = (customer_name) => {
	window.open(host + "/app/payment-entry/new-payment-entry?party_type=Customer&party=" + customer_name);
}
const createSalesOrder = (customer_name) => {
	window.open(host + "/app/sales-order/new-sales-order?customer=" + customer_name);
}


function show_available_credit_test_dialog (current_payment_avarage, closing_balance) {
	let dialog = new frappe.ui.Dialog({
	    title: 'Enter details',
	    fields: [
	        {
	            label: 'Amount',
	            fieldname: 'amount',
	            fieldtype: 'Currency',
	        },
			{
				fieldtype: "Column Break",
			},
			{
	            label: 'New Payment Avarage',
	            fieldname: 'new_payment_avarage',
	            fieldtype: 'Currency',
				read_only: 1,
	        },
			{
				fieldtype: "Section Break",
			},
	        {
	            label: 'New Credit Limit',
	            fieldname: 'new_credit_limt',
	            fieldtype: 'Currency',
				read_only: 1,
	        },
			{
				fieldtype: "Column Break",
			},
			{
	            label: 'Weeks To Close',
	            fieldname: 'weeks_to_close',
	            fieldtype: 'Int',
				read_only: 1,
	        },
			{
				fieldtype: "Section Break",
			},
			{
	            label: 'New Closing Balance',
	            fieldname: 'new_closing_balance',
	            fieldtype: 'Currency',
				read_only: 1,
	        },
			{
				fieldtype: "Column Break",
			},
			{
	            label: 'New Available Credit',
	            fieldname: 'new_available_credit',
	            fieldtype: 'Currency',
				read_only: 1,
	        },
	    ],
	    size: 'small', // small, large, extra-large
	    primary_action_label: 'Calculate',
		async primary_action(values) {
			const new_payment_avarage = current_payment_avarage + (values['amount'] / 13) + 1;

			dialog.set_value('new_payment_avarage', new_payment_avarage)

			let closer_avarage
			let credit_limits = []

			let rate = await frappe.db.get_doc('Rate Settings')
			rate['values'].reverse().forEach(rata => {
				if (new_payment_avarage + 1 >= rata['weekly_payment']) {
					credit_limits.push(rata)
				}
			});

			const new_closing_balance = closing_balance - values['amount'];
			if (new_payment_avarage >= 500) {
				dialog.set_value('new_credit_limt', credit_limits[0]['max_credit'])
				dialog.set_value('weeks_to_close', credit_limits[0]['rate_qty'])

				dialog.set_value('new_closing_balance', new_closing_balance)
				dialog.set_value('new_available_credit', credit_limits[0]['max_credit'] - new_closing_balance)
			} else {
				dialog.set_value('new_credit_limt', 0)
				dialog.set_value('weeks_to_close', 0)

				dialog.set_value('new_closing_balance', 0)
				dialog.set_value('new_available_credit', 0)
			}
	    }
	});

	dialog.show();
}

function show_promised_payment_test_dialog (current_payment_avarage, closing_balance) {
	let dialog = new frappe.ui.Dialog({
	    title: 'Enter details',
	    fields: [
	        {
	            label: 'Payment',
	            fieldname: 'payment',
	            fieldtype: 'Currency',
	        },
			{
				fieldtype: "Column Break",
			},
			{
	            label: 'New Order Amount',
	            fieldname: 'amount',
	            fieldtype: 'Currency',
	        },
			{
				fieldtype: "Section Break",
			},
			{
	            label: 'Current Credit',
	            fieldname: 'new_payment_avarage',
	            fieldtype: 'Currency',
				read_only: 1,
	        },
			{
				fieldtype: "Column Break",
			},
			{
	            label: 'New Credit',
	            fieldname: 'new_credit_limt',
	            fieldtype: 'Currency',
				read_only: 1,
	        },
			{
				fieldtype: "Column Break",
			},
			{
	            label: 'New Promised Payment',
	            fieldname: 'weeks_to_close',
	            fieldtype: 'Int',
				read_only: 1,
	        },
	    ],
	    size: 'small', // small, large, extra-large
	    primary_action_label: 'Calculate',
		async primary_action(values) {
			const new_payment_avarage = current_payment_avarage + (values['amount'] / 13) + 1;

			dialog.set_value('new_payment_avarage', new_payment_avarage)

			let closer_avarage
			let credit_limits = []

			let rate = await frappe.db.get_doc('Rate Settings')
			rate['values'].reverse().forEach(rata => {
				if (new_payment_avarage + 1 >= rata['weekly_payment']) {
					credit_limits.push(rata)
				}
			});

			const new_closing_balance = closing_balance - values['amount'];
			if (new_payment_avarage >= 500) {
				dialog.set_value('new_credit_limt', credit_limits[0]['max_credit'])
				dialog.set_value('weeks_to_close', credit_limits[0]['rate_qty'])

				dialog.set_value('new_closing_balance', new_closing_balance)
				dialog.set_value('new_available_credit', credit_limits[0]['max_credit'] - new_closing_balance)
			} else {
				dialog.set_value('new_credit_limt', 0)
				dialog.set_value('weeks_to_close', 0)

				dialog.set_value('new_closing_balance', 0)
				dialog.set_value('new_available_credit', 0)
			}
	    }
	});

	dialog.show();
}

const footerElement = document.querySelector('.report-footer'); // Example selector
if (footerElement) {
    const customText = document.createElement('p');
    customText.textContent = 'This is custom text added to the report footer.';
    footerElement.appendChild(customText);
}
