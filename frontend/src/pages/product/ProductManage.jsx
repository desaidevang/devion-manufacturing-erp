// src/pages/ProductManage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPackage, FiSearch, FiFilter, FiEdit2, 
  FiEye, FiTrash2, FiRefreshCw, FiPlus,
  FiChevronLeft, FiChevronRight, FiCheck,
  FiX, FiBox, FiList
} from 'react-icons/fi';
import ProductService from '../../services/productService';
import { toast } from 'react-toastify';

const ProductManage = () => {
  // State variables
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await ProductService.getAllProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'ALL' ? true :
      filterStatus === 'ACTIVE' ? product.isActive :
      filterStatus === 'INACTIVE' ? !product.isActive :
      filterStatus === 'WITH_BOM' ? product.hasBom :
      filterStatus === 'NO_BOM' ? !product.hasBom : true;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Handle product selection
  const toggleProductSelection = (id) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(productId => productId !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(product => product.id));
    }
  };

  // Handle delete
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await ProductService.deactivateProduct(productToDelete.id);
      toast.success(`Product "${productToDelete.productCode}" deactivated successfully`);
      
      // Update local state
      setProducts(products.map(p => 
        p.id === productToDelete.id ? { ...p, isActive: false } : p
      ));
      
      // Remove from selected products
      setSelectedProducts(selectedProducts.filter(id => id !== productToDelete.id));
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to deactivate product');
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  // Handle status filter
  const statusFilters = [
    { value: 'ALL', label: 'All Products', count: products.length },
    { value: 'ACTIVE', label: 'Active', count: products.filter(p => p.isActive).length },
    { value: 'INACTIVE', label: 'Inactive', count: products.filter(p => !p.isActive).length },
    { value: 'WITH_BOM', label: 'With BOM', count: products.filter(p => p.hasBom).length },
    { value: 'NO_BOM', label: 'No BOM', count: products.filter(p => !p.hasBom).length }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiPackage className="mr-3 text-blue-700" />
              Product Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and monitor all products in the system
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-800">
                {products.filter(p => p.isActive).length} Active Products
              </span>
            </div>
            <Link
              to="/product/create"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center shadow-lg"
            >
              <FiPlus className="mr-2" />
              New Product
            </Link>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 to-green-400 rounded-full"></div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by code, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {statusFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label} ({filter.count})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchProducts}
              className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
            
            {selectedProducts.length > 0 && (
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  {selectedProducts.length} selected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {statusFilters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try a different search term' : 'No products have been created yet'}
            </p>
            <Link
              to="/product/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              <FiPlus className="mr-2" />
              Create First Product
            </Link>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      BOM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-gray-50 transition ${
                        !product.isActive ? 'bg-gray-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg bg-blue-100 mr-3">
                            <FiPackage className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.productCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs mt-1">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {product.uom}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.hasBom ? (
                          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
                            <FiBox className="mr-1" />
                            With BOM
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            No BOM
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.isActive ? (
                          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
                            <FiCheck className="mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center">
                            <FiX className="mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/product/view/${product.id}`}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                            title="View"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/product/edit/${product.id}`}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </Link>
                          {product.isActive && (
                            <button
                              onClick={() => handleDeleteClick(product)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                              title="Deactivate"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredProducts.length}</span> products
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      {[5, 10, 25, 50].map(size => (
                        <option key={size} value={size}>
                          {size} per page
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 mr-4">
              <FiPackage className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 mr-4">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 mr-4">
              <FiBox className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With BOM</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.hasBom).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-100 mr-4">
              <FiList className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Without BOM</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => !p.hasBom).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirm Deactivation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate product "{productToDelete.productCode}"? 
              This action can be reversed later.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
              >
                Deactivate Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManage;