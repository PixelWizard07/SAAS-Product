const generateLabelHtml = (order, account) => {
  const barcode = order.orderId.replace(/[^A-Z0-9]/g, '');
  return `<!DOCTYPE html><html><head><style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    .label { width: 4in; min-height: 6in; border: 2px solid #000; padding: 10px; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
    .logo { font-weight: bold; font-size: 18px; color: #6366F1; }
    .barcode { font-family: monospace; font-size: 12px; letter-spacing: 3px; border: 1px solid #000; padding: 4px 8px; }
    .section { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #ccc; }
    .label-title { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 2px; }
    .label-value { font-size: 13px; font-weight: bold; }
    .address { font-size: 12px; line-height: 1.5; }
    .payment-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; }
    .cod { background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; }
    .prepaid { background: #D1FAE5; color: #065F46; border: 1px solid #10B981; }
    .order-id { font-family: monospace; font-size: 11px; }
  </style></head><body>
  <div class="label">
    <div class="header">
      <div class="logo">MeeshoHub</div>
      <div class="barcode">|||${barcode}|||</div>
    </div>
    <div class="section">
      <div class="label-title">Order ID</div>
      <div class="label-value order-id">${order.orderId}</div>
    </div>
    <div class="section">
      <div class="label-title">Ship To</div>
      <div class="address">
        <strong>${order.buyerName || 'N/A'}</strong><br/>
        ${order.buyerAddress || 'Address not available'}<br/>
      </div>
    </div>
    <div class="section">
      <div class="label-title">Product</div>
      <div class="label-value">${order.productName || 'N/A'}</div>
      ${order.variant ? `<div class="address">Variant: ${order.variant}</div>` : ''}
      <div class="address">Qty: ${order.quantity || 1}</div>
    </div>
    <div class="section">
      <div class="label-title">Seller</div>
      <div class="address">${account?.shopName || account?.nickname || 'Seller'}</div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
      <span class="payment-badge ${order.paymentMode === 'COD' ? 'cod' : 'prepaid'}">
        ${order.paymentMode === 'COD' ? `COD: ₹${order.price}` : 'PREPAID'}
      </span>
      <span style="font-size:11px;color:#666;">Generated: ${new Date().toLocaleDateString('en-IN')}</span>
    </div>
  </div></body></html>`;
};
module.exports = { generateLabelHtml };
