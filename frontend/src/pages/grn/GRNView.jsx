import React, { useEffect, useState } from "react";
import GRNService from "../../services/grnService";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiPrinter, 
  FiDownload, 
  FiCalendar,
  FiTruck,
  FiFileText,
  FiPackage,
  FiDollarSign,
  FiHash,
  FiMessageSquare,
  FiCheckCircle,
  FiXCircle,
  FiBox,
  FiClipboard,
  FiFile, // Added for Excel
  FiExternalLink // Added for popup view
} from "react-icons/fi";

const GRNView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grn, setGrn] = useState(null);
  const [inspectionData, setInspectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      // Fetch GRN details
      const grnRes = await GRNService.getGRNById(id);
      setGrn(grnRes.data);
      
      // Fetch inspection data if GRN is verified or completed
      if (grnRes.data.status === "VERIFIED" || grnRes.data.status === "COMPLETED") {
        try {
          const inspectionRes = await GRNService.getGRNInspection(id);
          setInspectionData(inspectionRes.data);
        } catch (error) {
          console.log("No inspection data available:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load GRN:", error);
    } finally {
      setLoading(false);
    }
  };

  // Excel Export Functions
  const exportToExcel = () => {
    setExporting(true);
    try {
      const worksheetData = prepareExcelData();
      const ws = XLSX.utils.json_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "GRN Details");
      
      // Add styling metadata
      const wscols = [
        { wch: 15 }, // Part Number
        { wch: 25 }, // Part Name
        { wch: 15 }, // Batch No
        { wch: 12 }, // Received Qty
        { wch: 10 }, // Accepted
        { wch: 10 }, // Rejected
        { wch: 12 }, // Unit Price
        { wch: 12 }, // Total
        { wch: 12 }, // Mfg Date
        { wch: 12 }, // Exp Date
        { wch: 25 }, // Remarks
        { wch: 20 }, // PSI Parameters
        { wch: 10 }, // PSI Result
        { wch: 15 }, // PSI Value
      ];
      ws['!cols'] = wscols;
      
      // Generate filename
      const fileName = `GRN_${grn.grnNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download file
      XLSX.writeFile(wb, fileName);
      
      // Show success message
      alert(`GRN exported successfully as ${fileName}`);
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Failed to export to Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const prepareExcelData = () => {
    const excelData = [];
    
    // Add company header
    excelData.push({
      'Part Number': 'Devion Technologies',
      'Part Name': 'Ahmedabad (Branch)',
      'Batch No': '',
      'Received Qty': '',
      'Accepted': '',
      'Rejected': '',
      'Unit Price': '',
      'Total': '',
      'Mfg Date': '',
      'Exp Date': '',
      'Remarks': '',
      'PSI Parameters': '',
      'PSI Result': '',
      'PSI Value': ''
    });
    
    // Add GRN header
    excelData.push({
      'Part Number': `GRN Number: ${grn.grnNumber}`,
      'Part Name': `Supplier: ${grn.supplierName}`,
      'Batch No': `Status: ${grn.status}`,
      'Received Qty': `PO Number: ${grn.poNumber || 'N/A'}`,
      'Accepted': `Invoice: ${grn.invoiceNumber}`,
      'Rejected': `Date: ${formatDate(grn.receivedDate)}`,
      'Unit Price': '',
      'Total': '',
      'Mfg Date': '',
      'Exp Date': '',
      'Remarks': '',
      'PSI Parameters': '',
      'PSI Result': '',
      'PSI Value': ''
    });
    
    // Add blank row
    excelData.push({});
    
    // Add items header
    excelData.push({
      'Part Number': 'PART DETAILS',
      'Part Name': '',
      'Batch No': '',
      'Received Qty': '',
      'Accepted': '',
      'Rejected': '',
      'Unit Price': '',
      'Total': '',
      'Mfg Date': '',
      'Exp Date': '',
      'Remarks': '',
      'PSI Parameters': 'PSI INSPECTION',
      'PSI Result': '',
      'PSI Value': ''
    });
    
    // Add items with PSI data
    grn.items.forEach((item, index) => {
      // Add item row
      excelData.push({
        'Part Number': item.partNumber,
        'Part Name': item.partName,
        'Batch No': item.batchNumber || '-',
        'Received Qty': item.receivedQty,
        'Accepted': item.acceptedQty,
        'Rejected': item.rejectedQty,
        'Unit Price': item.unitPrice ? `₹${item.unitPrice.toFixed(2)}` : '₹0.00',
        'Total': `₹${(item.receivedQty * (item.unitPrice || 0)).toFixed(2)}`,
        'Mfg Date': item.manufacturingDate || '-',
        'Exp Date': item.expiryDate || '-',
        'Remarks': item.remarks || '-',
        'PSI Parameters': '',
        'PSI Result': '',
        'PSI Value': ''
      });
      
      // Add PSI results for this item
      if (item.psiResults && item.psiResults.length > 0) {
        item.psiResults.forEach((psi, psiIndex) => {
          excelData.push({
            'Part Number': '',
            'Part Name': '',
            'Batch No': '',
            'Received Qty': '',
            'Accepted': '',
            'Rejected': '',
            'Unit Price': '',
            'Total': '',
            'Mfg Date': '',
            'Exp Date': '',
            'Remarks': '',
            'PSI Parameters': psi.standardName,
            'PSI Result': psi.result,
            'PSI Value': psi.value || '-'
          });
        });
      }
      
      // Add separator between items
      if (index < grn.items.length - 1) {
        excelData.push({});
      }
    });
    
    // Add summary
    excelData.push({});
    excelData.push({
      'Part Number': 'SUMMARY',
      'Part Name': '',
      'Batch No': '',
      'Received Qty': '',
      'Accepted': '',
      'Rejected': '',
      'Unit Price': '',
      'Total': '',
      'Mfg Date': '',
      'Exp Date': '',
      'Remarks': '',
      'PSI Parameters': '',
      'PSI Result': '',
      'PSI Value': ''
    });
    
    const totalReceived = grn.items.reduce((sum, item) => sum + item.receivedQty, 0);
    const totalAccepted = grn.items.reduce((sum, item) => sum + item.acceptedQty, 0);
    const totalRejected = grn.items.reduce((sum, item) => sum + item.rejectedQty, 0);
    const totalValue = calculateTotalValue();
    
    excelData.push({
      'Part Number': 'Total Quantity',
      'Part Name': totalReceived,
      'Batch No': 'Acceptance Rate',
      'Received Qty': `${getAcceptanceRate()}%`,
      'Accepted': 'Total Value',
      'Rejected': `₹${totalValue.toFixed(2)}`,
      'Unit Price': '',
      'Total': '',
      'Mfg Date': '',
      'Exp Date': '',
      'Remarks': '',
      'PSI Parameters': '',
      'PSI Result': '',
      'PSI Value': ''
    });
    
    return excelData;
  };

  const openExcelPreview = () => {
    const excelData = prepareExcelData();
    
    // Create HTML table for preview
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GRN ${grn.grnNumber} - Excel Preview</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1e40af; }
          .branch-name { font-size: 18px; color: #4b5563; margin-bottom: 10px; }
          .grn-header { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .section-title { background: #3b82f6; color: white; padding: 8px 12px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #e5e7eb; padding: 10px; text-align: left; border: 1px solid #d1d5db; }
          td { padding: 8px 10px; border: 1px solid #d1d5db; }
          .total-row { background: #fef3c7; font-weight: bold; }
          .psi-row { background: #f0f9ff; }
          .download-btn { 
            background: #10b981; color: white; padding: 10px 20px; 
            border: none; border-radius: 6px; cursor: pointer; margin: 20px 0;
          }
          .download-btn:hover { background: #059669; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Devion Technologies PVT LTD</div>
          <div class="branch-name">Ahmedabad (Branch)</div>
          <div class="grn-header">
            <h2>GRN: ${grn.grnNumber}</h2>
            <p>Supplier: ${grn.supplierName} | Date: ${formatDate(grn.receivedDate)} | Status: ${grn.status}</p>
          </div>
        </div>
        
        <div class="section-title">Items & PSI Inspection Results</div>
        <table>
          <thead>
            <tr>
              <th>Part Number</th>
              <th>Part Name</th>
              <th>Batch No.</th>
              <th>Received</th>
              <th>Accepted</th>
              <th>Rejected</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Mfg Date</th>
              <th>Exp Date</th>
              <th>Remarks</th>
              <th>PSI Parameter</th>
              <th>PSI Result</th>
              <th>PSI Value</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    grn.items.forEach((item, index) => {
      // Item row
      html += `
        <tr>
          <td>${item.partNumber}</td>
          <td>${item.partName}</td>
          <td>${item.batchNumber || '-'}</td>
          <td style="text-align: center">${item.receivedQty}</td>
          <td style="text-align: center; color: #10b981">${item.acceptedQty}</td>
          <td style="text-align: center; color: #ef4444">${item.rejectedQty}</td>
          <td>₹${item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}</td>
          <td>₹${(item.receivedQty * (item.unitPrice || 0)).toFixed(2)}</td>
          <td>${item.manufacturingDate || '-'}</td>
          <td>${item.expiryDate || '-'}</td>
          <td>${item.remarks || '-'}</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `;
      
      // PSI rows for this item
      if (item.psiResults && item.psiResults.length > 0) {
        item.psiResults.forEach((psi) => {
          html += `
            <tr class="psi-row">
              <td colspan="10"></td>
              <td></td>
              <td>${psi.standardName}</td>
              <td>${psi.result}</td>
              <td>${psi.value || '-'}</td>
            </tr>
          `;
        });
      }
    });
    
    // Summary row
    const totalReceived = grn.items.reduce((sum, item) => sum + item.receivedQty, 0);
    const totalAccepted = grn.items.reduce((sum, item) => sum + item.acceptedQty, 0);
    const totalRejected = grn.items.reduce((sum, item) => sum + item.rejectedQty, 0);
    const totalValue = calculateTotalValue();
    
    html += `
        </tbody>
      </table>
      
      <div class="section-title">Summary</div>
      <table>
        <tr class="total-row">
          <td colspan="3">Total Items: ${grn.items.length}</td>
          <td>Total Quantity: ${totalReceived}</td>
          <td>Accepted: ${totalAccepted}</td>
          <td>Rejected: ${totalRejected}</td>
          <td colspan="2">Total Value: ₹${totalValue.toFixed(2)}</td>
          <td colspan="2">Acceptance Rate: ${getAcceptanceRate()}%</td>
        </tr>
      </table>
      
      <button onclick="downloadExcel()" class="download-btn">
        Download Excel File
      </button>
      
      <script>
        function downloadExcel() {
          // Create Excel file
          const data = ${JSON.stringify(prepareExcelData())};
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "GRN Details");
          
          // Generate filename
          const fileName = "GRN_${grn.grnNumber}_${new Date().toISOString().split('T')[0]}.xlsx";
          
          // Download
          XLSX.writeFile(wb, fileName);
        }
      </script>
      
      <script src="https://unpkg.com/xlsx/dist/xlsx.full.min.js"></script>
      </body>
      </html>
    `;
    
    // Open in new window
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
  };

  const getPSIStatusColor = (result, value, min, max) => {
    if (result === "PASS") return "bg-green-50 border-green-200 text-green-700";
    if (result === "FAIL") return "bg-red-50 border-red-200 text-red-700";
    if (result === "VALUE") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && min !== undefined && max !== undefined) {
        if (numValue >= min && numValue <= max) {
          return "bg-blue-50 border-blue-200 text-blue-700";
        }
        return "bg-orange-50 border-orange-200 text-orange-700";
      }
    }
    return "bg-gray-50 border-gray-200 text-gray-700";
  };

  const getPSIStatusText = (result, value, min, max) => {
    if (result === "PASS") return "✓ Pass";
    if (result === "FAIL") return "✗ Fail";
    if (result === "VALUE") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && min !== undefined && max !== undefined) {
        if (numValue >= min && numValue <= max) {
          return `✓ ${value}`;
        }
        return `⚠ ${value} (Out of Spec)`;
      }
      return value;
    }
    return "Not Checked";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "VERIFIED": return "text-blue-600 bg-blue-100 border-blue-200";
      case "COMPLETED": return "text-green-600 bg-green-100 border-green-200";
      case "REJECTED": return "text-red-600 bg-red-100 border-red-200";
      default: return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const printGRN = () => {
    window.print();
  };

  const downloadGRN = () => {
    console.log("Downloading GRN PDF...");
  };

  const calculateTotalValue = () => {
    if (!grn?.items) return 0;
    return grn.items.reduce((sum, item) => 
      sum + (item.receivedQty * (item.unitPrice || 0)), 0
    );
  };

  const getAcceptanceRate = () => {
    if (!grn?.items || grn.items.length === 0) return 0;
    const totalReceived = grn.items.reduce((sum, item) => sum + item.receivedQty, 0);
    const totalAccepted = grn.items.reduce((sum, item) => sum + item.acceptedQty, 0);
    return totalReceived > 0 ? ((totalAccepted / totalReceived) * 100).toFixed(1) : 0;
  };

  // Load XLSX library dynamically
  useEffect(() => {
    const loadXLSX = () => {
      if (!window.XLSX) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/xlsx/dist/xlsx.full.min.js';
        script.onload = () => console.log('XLSX library loaded');
        document.head.appendChild(script);
      }
    };
    loadXLSX();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">GRN Not Found</h2>
          <p className="text-gray-500 mb-6">The requested GRN could not be loaded.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 print:p-0">
      {/* Header */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border hover:bg-gray-100"
              title="Go Back"
            >
              <FiArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                GRN: {grn.grnNumber}
              </h1>
              <p className="text-gray-600">
                Created on {formatDate(grn.receivedDate)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-full border font-medium ${getStatusColor(grn.status)}`}>
              {grn.status}
            </span>
            
            {/* Excel Export Buttons */}
            <div className="flex items-center gap-2 ml-2 border-l pl-2">
              <button
                onClick={openExcelPreview}
                className="p-2 border rounded-lg hover:bg-green-50 text-green-700 hover:border-green-300"
                title="View in Excel Format"
              >
                <FiExternalLink />
              </button>
              <button
                onClick={exportToExcel}
                disabled={exporting}
                className="p-2 border rounded-lg hover:bg-blue-50 text-blue-700 hover:border-blue-300 flex items-center gap-2"
                title="Download Excel"
              >
                <FiFile className={exporting ? "animate-spin" : ""} />
                {exporting && <span className="text-xs">Exporting...</span>}
              </button>
            </div>
            
            <button
              onClick={printGRN}
              className="p-2 border rounded-lg hover:bg-gray-100"
              title="Print GRN"
            >
              <FiPrinter />
            </button>
            <button
              onClick={downloadGRN}
              className="p-2 border rounded-lg hover:bg-gray-100"
              title="Download PDF"
            >
              <FiDownload />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:hidden">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
            <FiPackage /> Total Items
          </div>
          <div className="text-2xl font-bold">{grn.items.length}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
            <FiCheckCircle /> Acceptance Rate
          </div>
          <div className="text-2xl font-bold text-green-600">
            {getAcceptanceRate()}%
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
            <FiDollarSign /> Total Value
          </div>
          <div className="text-2xl font-bold">
            ₹{calculateTotalValue().toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
            <FiBox /> Total Quantity
          </div>
          <div className="text-2xl font-bold">
            {grn.items.reduce((sum, item) => sum + item.receivedQty, 0)}
          </div>
        </div>
      </div>

      {/* Company Header for Print */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-800">Devion Technologies PVT LTD</h1>
        <h2 className="text-lg text-gray-700">Ahmedabad (Branch)</h2>
        <div className="mt-2 text-gray-600">
          GRN: {grn.grnNumber} | Date: {formatDate(grn.receivedDate)}
        </div>
      </div>

      {/* GRN Details */}
      <div className="bg-white border rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiFileText /> GRN & Supplier Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FiHash /> Supplier
              </p>
              <p className="font-semibold">{grn.supplierName}</p>
              <p className="text-gray-600 text-sm">{grn.supplierCode}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FiFileText /> PO Number
              </p>
              <p className="font-semibold">{grn.poNumber || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FiFileText /> Invoice Number
              </p>
              <p className="font-semibold">{grn.invoiceNumber}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FiFileText /> Challan Number
              </p>
              <p className="font-semibold">{grn.challanNumber || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FiTruck /> Vehicle Number
              </p>
              <p className="font-semibold">{grn.vehicleNumber || "N/A"}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FiHash /> Shift
              </p>
              <p className="font-semibold">{grn.shift || "GENERAL"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FiCalendar /> Invoice Date
              </p>
              <p className="font-semibold">{formatDate(grn.invoiceDate)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FiCalendar /> Received Date
              </p>
              <p className="font-semibold">{formatDate(grn.receivedDate)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                Received By
              </p>
              <p className="font-semibold">{grn.receivedBy || "SYSTEM"}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                Status
              </p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(grn.status)}`}>
                {grn.status}
              </span>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                <FiMessageSquare /> Remarks
              </p>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-gray-700">{grn.remarks || "No remarks provided"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiPackage /> Items Received ({grn.items.length})
          </h2>
          <div className="text-sm text-gray-500">
            Total Quantity: {grn.items.reduce((sum, item) => sum + item.receivedQty, 0)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left font-medium text-gray-700 border">Part Number</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Part Name</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Batch No.</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Received Qty</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Accepted</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Rejected</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Unit Price</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Total</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Mfg. Date</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Exp. Date</th>
                <th className="p-3 text-left font-medium text-gray-700 border">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {grn.items.map((item, index) => (
                <React.Fragment key={index}>
                  {/* Main Item Row */}
                  <tr className="hover:bg-gray-50 border-b">
                    <td className="p-3 border">{item.partNumber}</td>
                    <td className="p-3 border">{item.partName}</td>
                    <td className="p-3 border">{item.batchNumber || "-"}</td>
                    <td className="p-3 border text-center">
                      <span className="font-medium">{item.receivedQty}</span>
                    </td>
                    <td className="p-3 border text-center">
                      <span className="text-green-600 font-medium">{item.acceptedQty}</span>
                    </td>
                    <td className="p-3 border text-center">
                      <span className="text-red-600 font-medium">{item.rejectedQty}</span>
                    </td>
                    <td className="p-3 border">
                      ₹{item.unitPrice ? item.unitPrice.toFixed(2) : "0.00"}
                    </td>
                    <td className="p-3 border font-medium">
                      ₹{(item.receivedQty * (item.unitPrice || 0)).toFixed(2)}
                    </td>
                    <td className="p-3 border">{item.manufacturingDate || "-"}</td>
                    <td className="p-3 border">{item.expiryDate || "-"}</td>
                    <td className="p-3 border max-w-xs">
                      <div className="text-gray-600 text-sm truncate" title={item.remarks}>
                        {item.remarks || "-"}
                      </div>
                    </td>
                  </tr>

                  {/* PSI Results Row */}
                  {item.psiResults && item.psiResults.length > 0 && (
                    <tr className="bg-gray-50">
                      <td colSpan="11" className="p-3">
                        <div className="p-3 border rounded-lg bg-white">
                          <h3 className="font-semibold text-gray-800 mb-3">PSI Results</h3>

                          <table className="w-full border-collapse text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-2 border">Parameter</th>
                                <th className="p-2 border">Result</th>
                                <th className="p-2 border">Value</th>
                                <th className="p-2 border">Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.psiResults.map((psi, psiIdx) => (
                                <tr key={psiIdx} className="border-b">
                                  <td className="p-2 border">{psi.standardName}</td>
                                  <td className="p-2 border">{psi.result}</td>
                                  <td className="p-2 border">{psi.value || "-"}</td>
                                  <td className="p-2 border">{psi.remarks || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>

            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="3" className="p-3 border text-right font-medium">
                  Totals:
                </td>
                <td className="p-3 border text-center font-medium">
                  {grn.items.reduce((sum, item) => sum + item.receivedQty, 0)}
                </td>
                <td className="p-3 border text-center font-medium text-green-600">
                  {grn.items.reduce((sum, item) => sum + item.acceptedQty, 0)}
                </td>
                <td className="p-3 border text-center font-medium text-red-600">
                  {grn.items.reduce((sum, item) => sum + item.rejectedQty, 0)}
                </td>
                <td className="p-3 border"></td>
                <td className="p-3 border font-bold">
                  ₹{calculateTotalValue().toFixed(2)}
                </td>
                <td colSpan="3" className="p-3 border"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PSI Results Section - Only show if inspection is completed */}
      {inspectionData && inspectionData.items && (
        <div className="bg-white border rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiClipboard /> PSI Inspection Results
          </h2>
          
          {inspectionData.items.map((item, index) => {
            // Check if this item has any PSI results
            const hasPSIResults = item.psi && item.psi.some(psi => psi.result);
            
            if (!hasPSIResults) return null;
            
            return (
              <div key={index} className="mb-6 last:mb-0">
                <div className="bg-gray-50 p-4 rounded-lg mb-3">
                  <h3 className="font-semibold text-gray-800">
                    {item.partName}
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-left font-medium text-gray-700 border">Parameter</th>
                        <th className="p-3 text-left font-medium text-gray-700 border">Specification</th>
                        <th className="p-3 text-left font-medium text-gray-700 border">Result</th>
                        <th className="p-3 text-left font-medium text-gray-700 border">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.psi.filter(psi => psi.result).map((psi, psiIndex) => (
                        <tr key={psiIndex} className="border-b hover:bg-gray-50">
                          <td className="p-3 border font-medium">{psi.standardName}</td>
                          <td className="p-3 border">
                            {psi.minValue !== undefined && psi.maxValue !== undefined ? (
                              <div className="text-sm">
                                <div>{psi.minValue} - {psi.maxValue} {psi.unit || ''}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="p-3 border">
                            <span className="font-medium">
                              {psi.value || '-'}
                            </span>
                          </td>
                          <td className="p-3 border">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              getPSIStatusColor(psi.result, psi.value, psi.minValue, psi.maxValue)
                            }`}>
                              {getPSIStatusText(psi.result, psi.value, psi.minValue, psi.maxValue)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Section */}
      <div className="mt-6 bg-white border rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Acceptance Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Items Received:</span>
                <span className="font-medium">{grn.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Acceptance Rate:</span>
                <span className="font-medium text-green-600">{getAcceptanceRate()}%</span>
              </div>
              <div className="flex justify-between">
                <span>Quality Status:</span>
                <span className={`font-medium ${getAcceptanceRate() > 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {getAcceptanceRate() > 90 ? 'Good' : 'Needs Attention'}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Financial Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-medium">₹{calculateTotalValue().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Unit Price:</span>
                <span className="font-medium">
                  ₹{(calculateTotalValue() / grn.items.reduce((sum, item) => sum + item.receivedQty, 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Back to List
        </button>
        <div className="flex gap-3">
          {grn.status === "PENDING" && (
            <button
              onClick={() => navigate(`/inspection/grn/${grn.id}`)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Inspect GRN
            </button>
          )}
          <button
            onClick={() => navigate(`/material/receive`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Manage GRNs
          </button>
        </div>
      </div>
    </div>
  );
};

export default GRNView;