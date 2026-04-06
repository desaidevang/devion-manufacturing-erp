import React, { useEffect, useState } from "react";
import GRNService from "../../services/grnService";
import { 
  FiSearch, 
  FiEye, 
  FiFilter, 
  FiChevronDown, 
  FiChevronUp,
  FiCalendar,
  FiTruck,
  FiFileText
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const ManageGRNs = () => {
  const navigate = useNavigate();
  const [grns, setGrns] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await GRNService.getAllGRN();
      setGrns(res.data);
    } catch (error) {
      console.error("Failed to load GRNs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort GRNs
  const filtered = grns
    .filter((g) => {
      // Status filter
      if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
      
      // Search filter
      const searchLower = search.toLowerCase();
      return (
        g.grnNumber.toLowerCase().includes(searchLower) ||
        g.supplierName.toLowerCase().includes(searchLower) ||
        g.invoiceNumber?.toLowerCase().includes(searchLower) ||
        g.poNumber?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      
      switch (sortBy) {
        case "date":
          return multiplier * (new Date(b.receivedDate) - new Date(a.receivedDate));
        case "number":
          return multiplier * a.grnNumber.localeCompare(b.grnNumber);
        case "supplier":
          return multiplier * a.supplierName.localeCompare(b.supplierName);
        default:
          return 0;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "VERIFIED": return "bg-blue-100 text-blue-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalItems = filtered.reduce((sum, grn) => sum + grn.items.length, 0);
  const totalValue = filtered.reduce((sum, grn) => {
    const grnValue = grn.items.reduce((itemSum, item) => 
      itemSum + (item.receivedQty * (item.unitPrice || 0)), 0
    );
    return sum + grnValue;
  }, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage GRNs</h1>
        <p className="text-gray-600">View and manage all Goods Received Notes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Total GRNs</div>
          <div className="text-2xl font-bold">{filtered.length}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Total Items</div>
          <div className="text-2xl font-bold">{totalItems}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {filtered.filter(g => g.status === "PENDING").length}
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-green-600">
            ₹{totalValue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border rounded-xl shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search GRN number, supplier, invoice..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <FiFilter />
            Filters
            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="number">GRN Number</option>
                  <option value="supplier">Supplier Name</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              {statusFilter !== "ALL" && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-1">
                  Status: {statusFilter}
                  <button 
                    onClick={() => setStatusFilter("ALL")}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {search && (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full flex items-center gap-1">
                  Search: "{search}"
                  <button 
                    onClick={() => setSearch("")}
                    className="ml-1 hover:text-gray-600"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* GRNs Table */}
      <div className="bg-white border rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-700">GRN Number</th>
                <th className="p-4 text-left font-semibold text-gray-700">Supplier</th>
                <th className="p-4 text-left font-semibold text-gray-700">Invoice</th>
                <th className="p-4 text-left font-semibold text-gray-700">Date</th>
                <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                <th className="p-4 text-left font-semibold text-gray-700">Items</th>
                <th className="p-4 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((grn) => (
                <tr key={grn.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold text-gray-900">{grn.grnNumber}</div>
                    {grn.poNumber && (
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <FiFileText className="text-gray-400" />
                        {grn.poNumber}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{grn.supplierName}</div>
                    <div className="text-sm text-gray-500">{grn.supplierCode}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{grn.invoiceNumber || "N/A"}</div>
                    {grn.challanNumber && (
                      <div className="text-sm text-gray-500">{grn.challanNumber}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FiCalendar className="text-gray-400" />
                      {formatDate(grn.receivedDate)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(grn.status)}`}>
                      {grn.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{grn.items.length} items</div>
                    <div className="text-sm text-gray-500">
                      Qty: {grn.items.reduce((sum, item) => sum + item.receivedQty, 0)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/grn/view/${grn.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      {grn.status === "PENDING" && (
                        <button
                          onClick={() => navigate(`/inspection/grn/${grn.id}`)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                        >
                          Inspect
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center">
                    <div className="text-gray-500">
                      <FiSearch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No GRNs found</p>
                      <p className="text-gray-500">
                        {search || statusFilter !== "ALL" 
                          ? "Try changing your search or filter criteria"
                          : "No GRNs have been created yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination/Filters Summary */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filtered.length}</span> of{' '}
            <span className="font-medium">{grns.length}</span> GRNs
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
        <button
          onClick={() => navigate("/material/receive/new")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New GRN
        </button>
      </div>
    </div>
  );
};

export default ManageGRNs;