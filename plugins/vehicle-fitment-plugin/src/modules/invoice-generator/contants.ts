export const DEFAULT_INVOICE_TEMPLATE = `
<!DOCTYPE html>
<html dir="{{dir}}">
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333; padding: 40px; direction: {{dir}}; }
    .invoice-container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
    {{#if isRtl}}
    .header { flex-direction: row-reverse; }
    {{/if}}
    .company-info h1 { color: #2563eb; font-size: 28px; margin-bottom: 8px; }
    .company-info p { margin-bottom: 4px; }
    .invoice-info { text-align: right; }
    {{#if isRtl}}
    .invoice-info { text-align: left; }
    .company-info { text-align: right; }
    {{/if}}
    .invoice-info h2 { font-size: 24px; color: #333; margin-bottom: 8px; }
    .invoice-meta { color: #666; font-size: 12px; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    {{#if isRtl}}
    .parties { flex-direction: row-reverse; }
    {{/if}}
    .party { width: 45%; }
    .party h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; letter-spacing: 1px; }
    .party p { margin-bottom: 4px; }
    .party .name { font-weight: bold; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    {{#if isRtl}}
    th { text-align: right; }
    {{/if}}
    th:last-child, td:last-child { text-align: right; }
    {{#if isRtl}}
    th:first-child, td:first-child { text-align: right; }
    th:last-child, td:last-child { text-align: left; }
    {{/if}}
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .totals { margin-left: auto; width: 300px; }
    {{#if isRtl}}
    .totals { margin-right: auto; margin-left: 0; }
    {{/if}}
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { border-top: 2px solid #2563eb; font-weight: bold; font-size: 18px; margin-top: 8px; padding-top: 16px; }
    .notes { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
    .notes h4 { margin-bottom: 8px; color: #333; }
  </style>
</head>
<body>
    <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        {{#if companyLogo}}
        <img src="{{companyLogo}}" alt="{{companyName}}" style="max-height: 60px; margin-bottom: 10px;" />
        {{else}}
        <h1>{{companyName}}</h1>
        {{/if}}
        <p>{{companyAddress}}</p>
        {{#if companyPhone}}<p>{{companyPhone}}</p>{{/if}}
        {{#if companyEmail}}<p>{{companyEmail}}</p>{{/if}}
      </div>
      <div class="invoice-info">
        <h2>{{t.invoice}}</h2>
        <div class="invoice-meta">
          <p><strong>#{{invoiceNumber}}</strong></p>
          <p>{{t.date}}: {{invoiceDate}}</p>
          <p>{{t.due}}: {{dueDate}}</p>
        </div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>{{t.billTo}}</h3>
        <p class="name">{{customerName}}</p>
        <p>{{customerAddress}}</p>
        <p>{{customerCity}}, {{customerCountry}}</p>
        {{#if customerPhone}}<p>{{customerPhone}}</p>{{/if}}
        {{#if customerEmail}}<p>{{customerEmail}}</p>{{/if}}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>{{t.description}}</th>
          <th>{{t.qty}}</th>
          <th>{{t.unitPrice}}</th>
          <th>{{t.total}}</th>
        </tr>
      </thead>
      <tbody>
        {{#each lineItems}}
        <tr>
          <td>{{description}}{{#if sku}}<br><small style="color: #666;">SKU: {{sku}}</small>{{/if}}</td>
          <td>{{quantity}}</td>
          <td>{{currency}} {{unitPrice}}</td>
          <td>{{currency}} {{total}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>{{t.subtotal}}</span>
        <span>{{currency}} {{subtotal}}</span>
      </div>
      {{#if discount}}
      <div class="totals-row">
        <span>{{t.discount}}</span>
        <span>-{{currency}} {{discount}}</span>
      </div>
      {{/if}}
      {{#if shipping}}
      <div class="totals-row">
        <span>{{t.shipping}}</span>
        <span>{{currency}} {{shipping}}</span>
      </div>
      {{/if}}
      <div class="totals-row">
        <span>{{t.tax}} ({{taxRate}}%)</span>
        <span>{{currency}} {{taxAmount}}</span>
      </div>
      <div class="totals-row total">
        <span>{{t.grandTotal}}</span>
        <span>{{currency}} {{total}}</span>
      </div>
    </div>

    {{#if notes}}
    <div class="notes">
      <h4>{{t.notes}}</h4>
      <p>{{notes}}</p>
    </div>
    {{/if}}
  </div>
</body>
</html>
`;
