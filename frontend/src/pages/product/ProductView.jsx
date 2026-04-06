// src/pages/ProductView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiPackage, FiBox, FiArrowLeft, FiEdit2, 
  FiCheck, FiX, FiFileText, FiCalendar,
  FiUsers, FiClipboard, FiList, FiLink,
  FiRefreshCw, FiPrinter, FiDownload,
  FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import ProductService from '../../services/productService';
import { toast } from 'react-toastify';

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bomItems, setBomItems] = useState([]);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await ProductService.getProductById(id);
      setProduct(response.data);
      
      // Fetch BOM separately
      const bomResponse = await ProductService.getProductBom(id);
      setBomItems(bomResponse.data || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
      navigate('/product/manage');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
          <p className="text-gray-600 mb-6">The requested product does not exist or has been deleted.</p>
          <Link
            to="/product/manage"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <FiArrowLeft className="mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/product/manage"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg mr-4 transition"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiPackage className="mr-3 text-blue-700" />
                {product.productName}
              </h1>
              <p className="text-gray-600 mt-2">
                {product.productCode} • Product Details
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-2 rounded-lg ${
              product.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <span className="text-sm font-medium flex items-center">
                {product.isActive ? (
                  <>
                    <FiCheck className="mr-1" /> Active
                  </>
                ) : (
                  <>
                    <FiX className="mr-1" /> Inactive
                  </>
                )}
              </span>
            </div>
            
            <Link
              to={`/product/edit/${id}`}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <FiEdit2 className="mr-2" />
              Edit
            </Link>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 to-green-400 rounded-full"></div>
      </div>

      {/* Product Info Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiFileText className="mr-2" />
                Product Information
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Code
                  </label>
                  <p className="text-lg font-bold text-gray-900">{product.productCode}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{product.productName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit of Measurement
                  </label>
                  <div className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">
                    {product.uom}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Has BOM
                  </label>
                  <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                    product.hasBom 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.hasBom ? (
                      <>
                        <FiCheckCircle className="mr-1" /> With BOM
                      </>
                    ) : (
                      <>
                        <FiAlertCircle className="mr-1" /> No BOM
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {product.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{product.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
              <FiClipboard className="mr-2" />
              Product Metadata
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Created By
                </label>
                <p className="text-sm font-medium text-gray-900">{product.createdBy || 'System'}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Created Date
                </label>
                <p className="text-sm text-gray-900">{formatDate(product.createdAt)}</p>
              </div>
              
              {product.updatedAt && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Last Updated
                  </label>
                  <p className="text-sm text-gray-900">{formatDate(product.updatedAt)}</p>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Record ID
                </label>
                <p className="text-xs font-mono text-gray-700 bg-white px-2 py-1 rounded border">
                  {product.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiFileText className="inline mr-2" />
              Details
            </button>
            
            {product.hasBom && (
              <button
                onClick={() => setActiveTab('bom')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bom'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiBox className="inline mr-2" />
                Bill of Materials
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiCalendar className="inline mr-2" />
              History
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        {activeTab === 'details' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Status Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      product.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">BOM Defined:</span>
                    <span className={`font-medium ${
                      product.hasBom ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {product.hasBom ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Components:</span>
                    <span className="font-medium text-gray-900">{bomItems.length}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Production Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    This product can be manufactured when all required components are available in stock.
                    {product.hasBom ? ' The BOM defines the exact quantities needed.' : ' No BOM defined.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bom' && product.hasBom && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiBox className="mr-2" />
                Bill of Materials
              </h3>
              <div className="text-sm text-gray-600">
                Total {bomItems.length} component(s)
              </div>
            </div>
            
            {bomItems.length === 0 ? (
              <div className="text-center py-8">
                <FiBox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No BOM items defined</p>
                <p className="text-sm text-gray-500 mt-1">
                  Add components to the BOM in the edit view
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Seq
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Part Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Part Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        UOM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bomItems
                      .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
                      .map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.sequenceNumber || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            to={`/part/view/${item.partId}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {item.partNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.partName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.partUom}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {item.quantityRequired}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.isOptional ? (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                              Optional
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              Required
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-md font-medium text-blue-800 mb-2 flex items-center">
                <FiClipboard className="mr-2" />
                BOM Usage Notes
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Required components must be available to manufacture this product</li>
                <li>• Optional components can be omitted if not available</li>
                <li>• Sequence numbers determine assembly order</li>
                <li>• BOM can be updated as needed</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product History</h3>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Product Created</span>
                  <span className="text-xs text-gray-500">{formatDate(product.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600">
                  Product was created by {product.createdBy || 'system user'}
                </p>
              </div>
              
              {product.updatedAt && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Last Updated</span>
                    <span className="text-xs text-gray-500">{formatDate(product.updatedAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Product details were last updated
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 text-center text-gray-500 text-sm">
              More detailed history tracking will be available in future updates
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between items-center pt-6 border-t border-gray-200">
        <Link
          to="/product/manage"
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Back to Products
        </Link>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchProductDetails}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition flex items-center"
          >
            <FiPrinter className="mr-2" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductView;