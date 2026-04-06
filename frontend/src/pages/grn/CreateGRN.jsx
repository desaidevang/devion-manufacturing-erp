// CreateGRN.jsx
import React, { useState, useEffect } from "react";
import SupplierService from "../../services/supplierService";
import PartService from "../../services/partService";
import GRNService from "../../services/grnService";
import ConfirmDialog from "../../components/ConfirmDialog";
import { FiPlus, FiTrash, FiSave, FiArrowLeft, FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CreateGRN = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredParts, setFilteredParts] = useState([]);

  const [form, setForm] = useState({
    supplierId: "",
    poNumber: "",
    invoiceNumber: "",
    challanNumber: "",
    vehicleNumber: "",
    shift: "GENERAL",
    remarks: "",
    items: [],
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const [newItem, setNewItem] = useState({
    partId: "",
    quantity: 1,
    unitPrice: 0,
    batchNumber: "",
    manufacturingDate: "",
    expiryDate: "",
    itemRemarks: "",
  });

  useEffect(() => {
    loadSuppliers();
    loadParts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = parts.filter(
        (part) =>
          part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          part.partName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParts(filtered);
    } else {
      setFilteredParts(parts.slice(0, 10));
    }
  }, [searchTerm, parts]);

  const loadSuppliers = async () => {
    const res = await SupplierService.getApprovedSuppliers();
    setSuppliers(res.data);
  };

  const loadParts = async () => {
    const res = await PartService.getActiveParts();
    setParts(res.data);
    setFilteredParts(res.data.slice(0, 10));
  };

  const addItemToList = () => {
    if (!newItem.partId) {
      toast.error("Please select a part");
      return;
    }
    if (newItem.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const selectedPart = parts.find(p => p.id === parseInt(newItem.partId));
    
    setForm({
      ...form,
      items: [...form.items, {
        ...newItem,
        partName: selectedPart?.partName || "",
        partNumber: selectedPart?.partNumber || ""
      }]
    });

    setNewItem({
      partId: "",
      quantity: 1,
      unitPrice: 0,
      batchNumber: "",
      manufacturingDate: "",
      expiryDate: "",
      itemRemarks: "",
    });
    setSearchTerm("");
  };

  const handleRemoveItem = (index) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Item",
      message: "Are you sure you want to remove this item from the GRN?",
      onConfirm: () => removeItem(index)
    });
  };

  const removeItem = (index) => {
    const updated = form.items.filter((_, idx) => idx !== index);
    setForm({ ...form, items: updated });
    toast.success("Item removed successfully");
  };

  const handleSubmit = () => {
    if (!form.supplierId || !form.invoiceNumber) {
      toast.error("Please fill all required fields (Supplier and Invoice Number)");
      return;
    }

    if (form.items.length === 0) {
      toast.error("Please add at least one item to GRN");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Create GRN",
      message: `Are you sure you want to create this GRN with ${form.items.length} item(s)?`,
      onConfirm: submit
    });
  };

  const submit = async () => {
    try {
      const payload = {
        ...form,
        items: form.items.map(item => ({
          partId: item.partId,
          receivedQty: item.quantity,
          unitPrice: item.unitPrice,
          batchNumber: item.batchNumber,
          manufacturingDate: item.manufacturingDate,
          expiryDate: item.expiryDate,
          remarks: item.itemRemarks
        }))
      };

      await GRNService.createGRN(payload);
      toast.success("GRN created successfully!");
      navigate("/material/receive");

    } catch (err) {
      console.error("GRN Error:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to create GRN");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border hover:bg-gray-100"
          >
            <FiArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create GRN</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow p-6">
        {/* Supplier & GRN Details Section */}
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Supplier & GRN Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier */}
            <div>
              <label className="font-medium block mb-2">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplierName} ({s.supplierCode})
                  </option>
                ))}
              </select>
            </div>

            {/* PO Number */}
            <div>
              <label className="font-medium block mb-2">PO Number</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., PO-2024-001"
                value={form.poNumber}
                onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="font-medium block mb-2">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., INV-2024-001"
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
              />
            </div>

            {/* Challan Number */}
            <div>
              <label className="font-medium block mb-2">Challan Number</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CH-2024-001"
                value={form.challanNumber}
                onChange={(e) => setForm({ ...form, challanNumber: e.target.value })}
              />
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="font-medium block mb-2">Vehicle Number</label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., MH-12-AB-1234"
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
              />
            </div>

            {/* Shift */}
            <div>
              <label className="font-medium block mb-2">Shift <span className="text-red-500">*</span></label>
              <select
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
              >
                <option value="GENERAL">General</option>
                <option value="MORNING">Morning</option>
                <option value="EVENING">Evening</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-6">
            <label className="font-medium block mb-2">Remarks</label>
            <textarea
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes or instructions..."
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </div>

        {/* Add Items Section */}
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Add Items to GRN</h3>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="flex items-center bg-gray-50 border rounded-lg px-4 py-3">
              <FiSearch className="text-gray-400 mr-3" />
              <input
                type="text"
                className="flex-1 bg-transparent outline-none"
                placeholder="Search parts by number or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* New Item Form */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
            <h4 className="font-medium text-gray-700 mb-4">Add New Item</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Part Selection */}
              <div>
                <label className="font-medium block mb-2">
                  Part <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newItem.partId}
                  onChange={(e) => setNewItem({ ...newItem, partId: e.target.value })}
                >
                  <option value="">Select Part</option>
                  {filteredParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partNumber} — {p.partName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="font-medium block mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>

              {/* Unit Price */}
              <div>
                <label className="font-medium block mb-2">Unit Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {/* Batch Number */}
              <div>
                <label className="font-medium block mb-2">Batch Number</label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., BATCH-001"
                  value={newItem.batchNumber}
                  onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
                />
              </div>

              {/* Manufacturing Date */}
              <div>
                <label className="font-medium block mb-2">Manufacturing Date</label>
                <input
                  type="date"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newItem.manufacturingDate}
                  onChange={(e) => setNewItem({ ...newItem, manufacturingDate: e.target.value })}
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="font-medium block mb-2">Expiry Date</label>
                <input
                  type="date"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newItem.expiryDate}
                  onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                />
              </div>
            </div>

            {/* Item Remarks */}
            <div className="mt-4">
              <label className="font-medium block mb-2">Item Remarks</label>
              <textarea
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Item specific notes..."
                value={newItem.itemRemarks}
                onChange={(e) => setNewItem({ ...newItem, itemRemarks: e.target.value })}
              />
            </div>

            {/* Add Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={addItemToList}
                className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                <FiPlus /> Add Item to GRN
              </button>
            </div>
          </div>
        </div>

        {/* GRN Items List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800">GRN Items ({form.items.length})</h3>
          </div>

          {form.items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No items added yet. Add items using the form above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 border text-left font-medium">Part Number</th>
                    <th className="p-3 border text-left font-medium">Part Name</th>
                    <th className="p-3 border text-left font-medium">Quantity</th>
                    <th className="p-3 border text-left font-medium">Unit Price</th>
                    <th className="p-3 border text-left font-medium">Batch</th>
                    <th className="p-3 border text-left font-medium">Mfg. Date</th>
                    <th className="p-3 border text-left font-medium">Exp. Date</th>
                    <th className="p-3 border text-left font-medium">Remarks</th>
                    <th className="p-3 border text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3 border">{item.partNumber}</td>
                      <td className="p-3 border">{item.partName}</td>
                      <td className="p-3 border">{item.quantity}</td>
                      <td className="p-3 border">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="p-3 border">{item.batchNumber || "-"}</td>
                      <td className="p-3 border">{item.manufacturingDate || "-"}</td>
                      <td className="p-3 border">{item.expiryDate || "-"}</td>
                      <td className="p-3 border">{item.itemRemarks || "-"}</td>
                      <td className="p-3 border">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-1"
                        >
                          <FiTrash /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={form.items.length === 0}
            className={`px-6 py-3 text-white rounded-lg flex items-center gap-2 ${
              form.items.length === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <FiSave /> Save GRN
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

export default CreateGRN;