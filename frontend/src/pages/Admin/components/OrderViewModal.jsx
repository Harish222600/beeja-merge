import React from 'react'
import { FiX, FiPrinter } from 'react-icons/fi'

export default function OrderViewModal({ order, onClose }) {
  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content')
    const originalContent = document.body.innerHTML
    
    document.body.innerHTML = printContent.innerHTML
    window.print()
    document.body.innerHTML = originalContent
    window.location.reload()
  }

  const generatePDF = async () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      const invoiceContent = document.getElementById('invoice-content').innerHTML
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${order.transactionId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.5; 
              color: #1f2937; 
              background: #ffffff;
              padding: 0;
            }
            .invoice-container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              min-height: 297mm;
              position: relative;
            }
            
            /* Header Section */
            .invoice-header {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
              color: white;
              padding: 40px 50px;
              position: relative;
              overflow: hidden;
            }
            .invoice-header::before {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 200px;
              height: 200px;
              background: rgba(255,255,255,0.1);
              border-radius: 50%;
              transform: translate(50px, -50px);
            }
            .header-content {
              position: relative;
              z-index: 2;
            }
            .logo-section {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .logo-container {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo {
              width: 50px;
              height: 50px;
              background: white;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              color: #1e40af;
              font-weight: bold;
            }
            .company-info h1 {
              font-size: 24px;
              font-weight: 700;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .company-info p {
              font-size: 14px;
              opacity: 0.9;
              margin: 2px 0;
            }
            .invoice-meta {
              text-align: right;
            }
            .invoice-title {
              font-size: 32px;
              font-weight: 300;
              letter-spacing: 2px;
              margin-bottom: 10px;
            }
            .invoice-number {
              font-size: 14px;
              opacity: 0.9;
            }
            
            /* Body Section */
            .invoice-body {
              padding: 50px;
            }
            
            /* Invoice Info Bar */
            .invoice-info-bar {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 25px;
              margin-bottom: 40px;
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
            }
            .info-item {
              text-align: center;
            }
            .info-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
              font-weight: 600;
            }
            .info-value {
              font-size: 14px;
              color: #1f2937;
              font-weight: 600;
            }
            
            /* Billing Section */
            .billing-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }
            .billing-card {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 25px;
              position: relative;
            }
            .billing-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 4px;
              height: 100%;
              background: linear-gradient(to bottom, #1e40af, #3b82f6);
              border-radius: 2px 0 0 2px;
            }
            .billing-title {
              font-size: 16px;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .billing-details p {
              margin: 8px 0;
              color: #4b5563;
              font-size: 14px;
            }
            .billing-details .name {
              font-weight: 700;
              color: #1f2937;
              font-size: 16px;
              margin-bottom: 10px;
            }
            
            /* Course Table */
            .course-section {
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 20px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .courses-table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .courses-table thead {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            }
            .courses-table th {
              color: white;
              padding: 20px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .courses-table td {
              padding: 20px;
              border-bottom: 1px solid #f1f5f9;
              color: #374151;
              vertical-align: top;
            }
            .course-name {
              font-weight: 600;
              color: #1f2937;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .course-details {
              font-size: 13px;
              color: #64748b;
            }
            .instructor-info {
              font-weight: 500;
              color: #1f2937;
              margin-bottom: 3px;
            }
            .instructor-email {
              font-size: 13px;
              color: #64748b;
            }
            .amount {
              font-size: 18px;
              font-weight: 700;
              color: #059669;
            }
            
            /* Total Section */
            .total-section {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 25px;
              margin-bottom: 40px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .total-row:last-child {
              border-bottom: none;
              font-size: 20px;
              font-weight: 700;
              color: #1f2937;
              padding-top: 15px;
              margin-top: 10px;
              border-top: 2px solid #1e40af;
            }
            .total-label {
              color: #64748b;
              font-weight: 500;
            }
            .total-value {
              font-weight: 600;
              color: #1f2937;
            }
            
            /* Footer */
            .invoice-footer {
              background: #f8fafc;
              border-top: 1px solid #e5e7eb;
              padding: 40px 50px;
              text-align: center;
              margin-top: auto;
            }
            .footer-content {
              max-width: 600px;
              margin: 0 auto;
            }
            .thank-you {
              font-size: 18px;
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 15px;
            }
            .footer-text {
              color: #64748b;
              font-size: 14px;
              margin: 8px 0;
              line-height: 1.6;
            }
            .contact-info {
              display: flex;
              justify-content: center;
              gap: 30px;
              margin: 20px 0;
              flex-wrap: wrap;
            }
            .contact-item {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #1e40af;
              font-weight: 500;
              font-size: 14px;
            }
            .footer-note {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 20px;
              font-style: italic;
            }
            
            /* Print Styles */
            @media print {
              body { background: white; }
              .invoice-container { box-shadow: none; margin: 0; }
              .invoice-header::before { display: none; }
            }
            
            /* Responsive */
            @media (max-width: 768px) {
              .billing-section { grid-template-columns: 1fr; }
              .invoice-info-bar { grid-template-columns: 1fr; }
              .contact-info { flex-direction: column; gap: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="header-content">
                <div class="logo-section">
                  <div class="logo-container">
                    <div class="logo">🎓</div>
                    <div class="company-info">
                      <h1>Beeja Academy</h1>
                      <p>Excellence in Education</p>
                      <p>www.beejaacademy.com</p>
                    </div>
                  </div>
                  <div class="invoice-meta">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-number">INV-${order._id.slice(-8).toUpperCase()}</div>
                    <div class="invoice-number">${new Date(order.purchaseDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="invoice-body">
              <div class="invoice-info-bar">
                <div class="info-item">
                  <div class="info-label">Order ID</div>
                  <div class="info-value">${order._id}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Transaction ID</div>
                  <div class="info-value">${order.transactionId}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Payment Method</div>
                  <div class="info-value">${order.paymentMethod}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value" style="color: #059669;">✓ Paid</div>
                </div>
              </div>

              <div class="billing-section">
                <div class="billing-card">
                  <div class="billing-title">
                    🏢 Bill From
                  </div>
                  <div class="billing-details">
                    <div class="name">Beeja Academy</div>
                    <p><strong>Contact Person:</strong> DineshKumar</p>
                    <p><strong>Phone:</strong> +91 9585113955</p>
                    <p><strong>Email:</strong> dinesh@beejaacademy.com</p>
                    <p><strong>Website:</strong> www.beejaacademy.com</p>
                  </div>
                </div>
                <div class="billing-card">
                  <div class="billing-title">
                    👤 Bill To
                  </div>
                  <div class="billing-details">
                    <div class="name">${`${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'N/A'}</div>
                    <p><strong>Phone:</strong> ${order.user?.additionalDetails?.contactNumber || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.user?.email || 'N/A'}</p>
                    <p><strong>Enrolled:</strong> ${new Date(order.purchaseDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</p>
                  </div>
                </div>
              </div>

              <div class="course-section">
                <div class="section-title">
                  📚 Course Details
                </div>
                <table class="courses-table">
                  <thead>
                    <tr>
                      <th style="width: 50%;">Course Information</th>
                      <th style="width: 30%;">Instructor</th>
                      <th style="width: 20%; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div class="course-name">${order.course?.courseName || 'N/A'}</div>
                        <div class="course-details">Lifetime Access • Digital Course</div>
                      </td>
                      <td>
                        <div class="instructor-info">${order.course?.instructor?.firstName || 'DineshKumar'}</div>
                        <div class="instructor-email">${order.course?.instructor?.email || 'dinesh@beejaacademy.com'}</div>
                      </td>
                      <td style="text-align: right;">
                        <div class="amount">${order.amount === 0 ? 'Free' : `Rs. ${order.amount}`}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="total-section">
                <div class="total-row">
                  <span class="total-label">Subtotal:</span>
                  <span class="total-value">${order.amount === 0 ? 'Free' : `Rs. ${order.amount}`}</span>
                </div>
                <div class="total-row">
                  <span class="total-label">Tax (GST):</span>
                  <span class="total-value">Rs. 0.00</span>
                </div>
                <div class="total-row">
                  <span class="total-label">Discount:</span>
                  <span class="total-value">Rs. 0.00</span>
                </div>
                <div class="total-row">
                  <span>Total Amount:</span>
                  <span style="color: #059669;">${order.amount === 0 ? 'Free' : `Rs. ${order.amount}`}</span>
                </div>
              </div>
            </div>

            <div class="invoice-footer">
              <div class="footer-content">
                <div class="thank-you">Thank you for choosing Beeja Academy!</div>
                <p class="footer-text">Your trust in our educational platform means everything to us. We're committed to providing you with the best learning experience.</p>
                
                <div class="contact-info">
                  <div class="contact-item">
                    📧 dinesh@beejaacademy.com
                  </div>
                  <div class="contact-item">
                    📱 +91 9585113955
                  </div>
                  <div class="contact-item">
                    🌐 www.beejaacademy.com
                  </div>
                </div>
                
                <p class="footer-note">
                  This is a computer-generated invoice. No physical signature is required.
                  <br>
                  Generated on ${new Date().toLocaleDateString('en-IN')} | Beeja Academy © ${new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `)
      
      printWindow.document.close()
      printWindow.focus()
      
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center overflow-auto bg-white bg-opacity-10 backdrop-blur-sm">
      <div className="w-11/12 max-w-4xl rounded-lg border border-richblack-400 bg-richblack-800 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-richblack-700 pb-4">
          <h2 className="text-xl font-semibold text-richblack-5">Order Invoice</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 rounded-md bg-yellow-50 px-4 py-2 text-richblack-900 hover:bg-yellow-25"
            >
              <FiPrinter />
              Print
            </button>
            <button
              onClick={onClose}
              className="text-richblack-300 hover:text-richblack-100"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content" className="mt-6">
          {/* Modern Header with Logo */}
          <div className="bg-gradient-to-r from-richblack-700 to-richblack-800 p-8 rounded-t-lg text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-3xl">🎓</div>
              <div className="text-2xl font-bold text-yellow-50">Beeja Academy</div>
            </div>
            <h1 className="text-4xl font-bold text-yellow-50 mb-3 tracking-wider">INVOICE</h1>
            <p className="text-richblack-25 text-lg">
              Date: {new Date(order.purchaseDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-50 to-yellow-100"></div>
          </div>

          {/* From/To Section */}
          <div className="bg-richblack-800 p-6 rounded-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-richblack-700 p-6 rounded-lg border-l-4 border-yellow-50">
                <h3 className="text-lg font-semibold text-yellow-50 mb-4 flex items-center gap-2">
                  <span className="text-blue-400">🏢</span> Bill From:
                </h3>
                <div className="space-y-2">
                  <p className="font-bold text-richblack-5 text-lg">Beeja Academy</p>
                  <p className="text-richblack-300">DineshKumar</p>
                  <p className="text-richblack-300">📞 +91 9585113955</p>
                  <p className="text-richblack-300">✉️ dinesh@beejaacademy.com</p>
                  <p className="text-richblack-300">🌐 www.beejaacademy.com</p>
                </div>
              </div>
              <div className="bg-richblack-700 p-6 rounded-lg border-l-4 border-green-400">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <span className="text-green-400">👤</span> Bill To:
                </h3>
                <div className="space-y-2">
                  <p className="font-bold text-richblack-5 text-lg">
                    {`${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'N/A'}
                  </p>
                  <p className="text-richblack-300">📞 {order.user?.additionalDetails?.contactNumber || 'N/A'}</p>
                  <p className="text-richblack-300">✉️ {order.user?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="mb-8 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-richblack-5">Order ID: </span>
                <span className="text-richblack-300">{order._id}</span>
              </div>
              <div>
                <span className="font-medium text-richblack-5">Transaction ID: </span>
                <span className="text-richblack-300">{order.transactionId}</span>
              </div>
              <div>
                <span className="font-medium text-richblack-5">Payment Method: </span>
                <span className="text-richblack-300">{order.paymentMethod}</span>
              </div>
              <div>
                <span className="font-medium text-richblack-5">Currency: </span>
                <span className="text-richblack-300">INR</span>
              </div>
              <div>
                <span className="font-medium text-richblack-5">Payment Status: </span>
                <span className="text-green-400">Received</span>
              </div>
              <div>
                <span className="font-medium text-richblack-5">Enroll On: </span>
                <span className="text-richblack-300">
                  {new Date(order.purchaseDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="bg-richblack-800 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-yellow-50 mb-6 flex items-center gap-2">
              <span className="text-yellow-100">📚</span> Course Details
            </h3>
            <div className="overflow-hidden rounded-lg border border-richblack-700">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-richblack-700 to-richblack-600">
                    <th className="p-4 text-left text-sm font-semibold text-yellow-50">Course Name</th>
                    <th className="p-4 text-left text-sm font-semibold text-yellow-50">Instructor</th>
                    <th className="p-4 text-right text-sm font-semibold text-yellow-50">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-richblack-700 bg-richblack-700 bg-opacity-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-richblack-5">{order.course?.courseName || 'N/A'}</p>
                        <p className="text-xs text-richblack-300">Lifetime Access</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-richblack-5">{order.course?.instructor?.firstName || 'DineshKumar'}</p>
                        <p className="text-xs text-richblack-300">{order.course?.instructor?.email || 'dinesh@beejaacademy.com'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-medium text-yellow-50">{order.amount === 0 ? 'Free' : `Rs. ${order.amount}`}</p>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t border-richblack-600 bg-richblack-700">
                    <td colSpan="2" className="p-4 text-right font-semibold text-richblack-5">Total Amount:</td>
                    <td className="p-4 text-right">
                      <p className="text-lg font-bold text-yellow-50">{order.amount === 0 ? 'Free' : `Rs. ${order.amount}`}</p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-richblack-800 p-6 rounded-lg mt-8 text-center border-t-2 border-richblack-700">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <p className="text-lg font-semibold text-yellow-50 mb-2">Thank you for choosing Beeja Academy!</p>
                <p className="text-richblack-300">Your trust in our educational platform means a lot to us.</p>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-50">📧</span>
                  <a href="mailto:dinesh@beejaacademy.com" className="text-yellow-50 hover:text-yellow-100 transition-colors">
                    dinesh@beejaacademy.com
                  </a>
                </div>
                <div className="hidden md:block text-richblack-500">|</div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-50">📱</span>
                  <a href="tel:+919585113955" className="text-yellow-50 hover:text-yellow-100 transition-colors">
                    +91 9585113955
                  </a>
                </div>
              </div>

              <p className="mt-6 text-xs text-richblack-400">
                This is a computer-generated invoice. No signature is required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
