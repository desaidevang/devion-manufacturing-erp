import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GRNService from "../../services/grnService";
import ConfirmDialog from "../../components/ConfirmDialog";
import { 
  FiSave, 
  FiArrowLeft, 
  FiCheck, 
  FiX, 
  FiAlertCircle,
  FiClipboard,
  FiBarChart2,
  FiCheckCircle,
  FiXCircle,
  FiPackage,
  FiHash
} from "react-icons/fi";

const InspectGRN = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inspectionData, setInspectionData] = useState({});
  const [overallStatus, setOverallStatus] = useState("PENDING");
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  useEffect(() => {
    loadGRNInspection();
  }, []);

  const loadGRNInspection = async () => {
    setLoading(true);
    try {
      const res = await GRNService.getGRNInspection(id);
      setGrn(res.data);

      const initial = {};
      let totalAccepted = 0;
      let totalReceived = 0;

      res.data.items.forEach(item => {
        totalReceived += item.receivedQty;
        totalAccepted += item.acceptedQty || 0;
        
        initial[item.partId] = {
          acceptedQty: item.acceptedQty || item.receivedQty,
          rejectedQty: item.rejectedQty || 0,
          remarks: item.inspectionRemarks || "",
          psiResults: item.psi.map(psi => ({
            psiItemId: psi.id,
            result: psi.result || "PASS",
            value: psi.value || "",
            minValue: psi.minValue,
            maxValue: psi.maxValue,
            unit: psi.unit
          }))
        };
      });

      // Calculate overall status
      const acceptanceRate = (totalAccepted / totalReceived) * 100;
      let status = "PENDING";
      if (acceptanceRate >= 95) status = "APPROVED";
      else if (acceptanceRate >= 80) status = "CONDITIONAL";
      else status = "REJECTED";
      
      setOverallStatus(status);
      setInspectionData(initial);
    } catch (e) {
      console.error("Failed to load inspection:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateResult = (partId, psiItemId, field, value) => {
    setInspectionData(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        psiResults: prev[partId].psiResults.map(r =>
          r.psiItemId === psiItemId ? { ...r, [field]: value } : r
        )
      }
    }));
  };

  const updateRemarks = (partId, remarks) => {
    setInspectionData(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        remarks
      }
    }));
  };

  const updateQuantity = (partId, field, value) => {
    const receivedQty = grn.items.find(item => item.partId === parseInt(partId))?.receivedQty || 0;
    const newValue = parseInt(value) || 0;
    
    setInspectionData(prev => {
      const current = prev[partId];
      let newAccepted = current.acceptedQty;
      let newRejected = current.rejectedQty;
      
      if (field === 'acceptedQty') {
        newAccepted = Math.min(Math.max(0, newValue), receivedQty);
        newRejected = receivedQty - newAccepted;
      } else if (field === 'rejectedQty') {
        newRejected = Math.min(Math.max(0, newValue), receivedQty);
        newAccepted = receivedQty - newRejected;
      }
      
      return {
        ...prev,
        [partId]: {
          ...prev[partId],
          acceptedQty: newAccepted,
          rejectedQty: newRejected
        }
      };
    });
  };

  const getPSIStatusColor = (result, value, min, max) => {
    if (result === "FAIL") return "bg-red-50 border-red-200 text-red-700";
    if (result === "PASS") return "bg-green-50 border-green-200 text-green-700";
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

  const validateInspection = () => {
    const errors = [];
    Object.keys(inspectionData).forEach(partId => {
      const item = inspectionData[partId];
      const grnItem = grn.items.find(i => i.partId === parseInt(partId));
      
      if (item.acceptedQty + item.rejectedQty !== grnItem.receivedQty) {
        errors.push(`Quantity mismatch for ${grnItem.partName}`);
      }
      
      item.psiResults.forEach(psi => {
        if (psi.result === "VALUE" && !psi.value.trim()) {
          errors.push(`Missing value for PSI in ${grnItem.partName}`);
        }
      });
    });
    
    return errors;
  };

  const handleSaveInspection = () => {
    const validationErrors = validateInspection();
    if (validationErrors.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: "Validation Errors",
        message: `Please fix the following errors:\n\n${validationErrors.join('\n')}`,
        onConfirm: () => {} // Just close the dialog
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Submit Inspection",
      message: "Are you sure you want to submit this inspection? This action cannot be undone.",
      onConfirm: saveInspection
    });
  };

  const saveInspection = async () => {
    setSaving(true);
    try {
   const payload = {
  items: Object.keys(inspectionData).map(partId => ({
    partId: parseInt(partId),
    acceptedQty: inspectionData[partId].acceptedQty,
    rejectedQty: inspectionData[partId].rejectedQty,
    remarks: inspectionData[partId].remarks,
    inspectionResults: inspectionData[partId].psiResults.map(r => ({
      psiItemId: r.psiItemId,
      result: r.result,
      value: r.value,
      remarks: r.remarks || ""
    }))
  }))
};

      await GRNService.submitInspection(id, payload);
      
      setConfirmDialog({
        isOpen: true,
        title: "Success",
        message: "Inspection submitted successfully!",
        onConfirm: () => navigate(`/grn/view/${id}`)
      });
    } catch (error) {
      console.error("Failed to submit inspection:", error);
      setConfirmDialog({
        isOpen: true,
        title: "Error",
        message: "Failed to submit inspection. Please try again.",
        onConfirm: () => {}
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Reset All Data",
      message: "Are you sure you want to reset all inspection data? All your changes will be lost.",
      onConfirm: () => {
        loadGRNInspection();
      }
    });
  };

  const calculateAcceptanceRate = () => {
    if (!grn || !inspectionData) return 0;
    
    let totalReceived = 0;
    let totalAccepted = 0;
    
    Object.keys(inspectionData).forEach(partId => {
      const grnItem = grn.items.find(i => i.partId === parseInt(partId));
      if (grnItem) {
        totalReceived += grnItem.receivedQty;
        totalAccepted += inspectionData[partId].acceptedQty;
      }
    });
    
    return totalReceived > 0 ? ((totalAccepted / totalReceived) * 100).toFixed(1) : 0;
  };

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
          <p className="text-gray-500 mb-6">The requested GRN could not be loaded for inspection.</p>
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/grn/view/${id}`)}
              className="p-2 rounded-lg border hover:bg-gray-100"
              title="Go Back"
            >
              <FiArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <FiClipboard className="inline mr-2" />
                GRN Inspection: {grn.grnNumber}
              </h1>
              <p className="text-gray-600">
                Supplier: {grn.supplierName} • {grn.items.length} Items to Inspect
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Acceptance Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {calculateAcceptanceRate()}%
              </div>
            </div>
            <button
              onClick={handleSaveInspection}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave /> Submit Inspection
                </>
              )}
            </button>
          </div>
        </div>

        {/* Overall Status Indicator */}
        <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                overallStatus === "APPROVED" ? "bg-green-100 text-green-700" :
                overallStatus === "CONDITIONAL" ? "bg-yellow-100 text-yellow-700" :
                overallStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                <FiBarChart2 size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Inspection Status</h3>
                <p className="text-gray-600 text-sm">
                  Based on current entries, the GRN will be marked as <span className="font-semibold">{overallStatus}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Items</div>
              <div className="text-2xl font-bold">{grn.items.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Items */}
      <div className="space-y-6">
        {grn.items.map((item, index) => (
          <div key={item.partId} className="bg-white border rounded-xl shadow p-6">
            {/* Item Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FiPackage className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {item.partName}
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({item.partNumber})
                    </span>
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Batch: {item.batchNumber || "N/A"} • 
                    Received: <span className="font-semibold">{item.receivedQty}</span> units
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500">Item {index + 1} of {grn.items.length}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    inspectionData[item.partId]?.acceptedQty === item.receivedQty ? 
                    "bg-green-100 text-green-700" :
                    inspectionData[item.partId]?.rejectedQty === item.receivedQty ?
                    "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {inspectionData[item.partId]?.acceptedQty === item.receivedQty ? "Fully Accepted" :
                     inspectionData[item.partId]?.rejectedQty === item.receivedQty ? "Fully Rejected" :
                     "Partially Accepted"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Input Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiHash /> Quantity Inspection
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Received Quantity
                  </label>
                  <div className="border p-3 rounded-lg bg-gray-50 text-center">
                    <span className="text-2xl font-bold text-gray-800">{item.receivedQty}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accepted Quantity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={item.receivedQty}
                      className="w-full border p-3 rounded-lg text-center text-lg font-semibold border-green-300 bg-green-50"
                      value={inspectionData[item.partId]?.acceptedQty || 0}
                      onChange={(e) => updateQuantity(item.partId, 'acceptedQty', e.target.value)}
                    />
                    <div className="absolute right-3 top-3 text-green-600">
                      <FiCheckCircle />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejected Quantity
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={item.receivedQty}
                      className="w-full border p-3 rounded-lg text-center text-lg font-semibold border-red-300 bg-red-50"
                      value={inspectionData[item.partId]?.rejectedQty || 0}
                      onChange={(e) => updateQuantity(item.partId, 'rejectedQty', e.target.value)}
                    />
                    <div className="absolute right-3 top-3 text-red-600">
                      <FiXCircle />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quantity Summary */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Acceptance Rate:</span>
                  <span className="font-semibold">
                    {item.receivedQty > 0 ? 
                      ((inspectionData[item.partId]?.acceptedQty / item.receivedQty) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${item.receivedQty > 0 ? 
                      (inspectionData[item.partId]?.acceptedQty / item.receivedQty) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* PSI Inspection Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiClipboard /> PSI (Process & System Inspection)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 text-left font-medium text-gray-700 border">Parameter</th>
                      <th className="p-3 text-left font-medium text-gray-700 border">Description</th>
                      <th className="p-3 text-left font-medium text-gray-700 border">Specification</th>
                      <th className="p-3 text-left font-medium text-gray-700 border">Result</th>
                      <th className="p-3 text-left font-medium text-gray-700 border">Value</th>
                      <th className="p-3 text-left font-medium text-gray-700 border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.psi.map(psi => {
                      const psiResult = inspectionData[item.partId]?.psiResults.find(r => r.psiItemId === psi.id);
                      return (
                        <tr key={psi.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 border font-medium">{psi.standardName}</td>
                          <td className="p-3 border text-gray-600">{psi.description || "—"}</td>
                          <td className="p-3 border">
                            {psi.minValue !== undefined && psi.maxValue !== undefined ? (
                              <div className="text-sm">
                                <div className="font-medium">Min: {psi.minValue} {psi.unit}</div>
                                <div className="font-medium">Max: {psi.maxValue} {psi.unit}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="p-3 border">
                            <select
                              className={`w-full p-2 border rounded ${
                                psiResult?.result === "PASS" ? "border-green-300" :
                                psiResult?.result === "FAIL" ? "border-red-300" :
                                "border-blue-300"
                              }`}
                              value={psiResult?.result || "PASS"}
                              onChange={(e) => updateResult(item.partId, psi.id, "result", e.target.value)}
                            >
                              <option value="PASS">Pass</option>
                              <option value="FAIL">Fail</option>
                              <option value="VALUE">Enter Value</option>
                            </select>
                          </td>
                          <td className="p-3 border">
                            <input
                              type="text"
                              className="w-full p-2 border rounded"
                              placeholder={psi.unit ? `Enter value in ${psi.unit}` : "Enter value"}
                              value={psiResult?.value || ""}
                              onChange={(e) => updateResult(item.partId, psi.id, "value", e.target.value)}
                              disabled={psiResult?.result !== "VALUE"}
                            />
                          </td>
                          <td className="p-3 border">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              getPSIStatusColor(psiResult?.result, psiResult?.value, psi.minValue, psi.maxValue)
                            }`}>
                              {psiResult?.result === "PASS" ? "Pass" :
                               psiResult?.result === "FAIL" ? "Fail" :
                               "Value Entered"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Remarks Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Remarks
              </label>
              <textarea
                className="w-full border p-3 rounded-lg h-24"
                placeholder="Enter inspection remarks, observations, or notes..."
                value={inspectionData[item.partId]?.remarks || ""}
                onChange={(e) => updateRemarks(item.partId, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t flex justify-between">
        <button
          onClick={() => navigate(`/grn/view/${id}`)}
          className="px-6 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <FiArrowLeft /> Cancel Inspection
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={handleResetAll}
            className="px-6 py-3 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50"
          >
            Reset All
          </button>
          <button
            onClick={handleSaveInspection}
            disabled={saving}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <FiCheck size={20} /> Submit Complete Inspection
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Yes, Confirm"
        cancelText="Cancel"
      />
    </div>
  );
};

export default InspectGRN;