import axiosInstance from '../api/axios';

class SupplierService {
  // Create new supplier
  createSupplier(supplierData) {
    return axiosInstance.post('/warehouse/suppliers', supplierData);
  }

  // Get all suppliers
  getAllSuppliers() {
    return axiosInstance.get('/warehouse/suppliers');
  }

  // Get approved suppliers
  getApprovedSuppliers() {
    return axiosInstance.get('/warehouse/suppliers/approved');
  }

  // Get supplier by ID
  getSupplierById(id) {
    return axiosInstance.get(`/warehouse/suppliers/${id}`);
  }

  // Get supplier by code
  getSupplierByCode(supplierCode) {
    return axiosInstance.get(`/warehouse/suppliers/code/${supplierCode}`);
  }

  // Update supplier
  updateSupplier(id, supplierData) {
    return axiosInstance.put(`/warehouse/suppliers/${id}`, supplierData);
  }

  // Update supplier status
  updateSupplierStatus(id, status) {
    return axiosInstance.patch(`/warehouse/suppliers/${id}/status?status=${status}`);
  }

  // Update supplier approval
  updateSupplierApproval(id, isApproved) {
    return axiosInstance.patch(`/warehouse/suppliers/${id}/approval?isApproved=${isApproved}`);
  }

  // Search suppliers
  searchSuppliers(searchTerm, status) {
    let url = `/warehouse/suppliers/search`;
    const params = new URLSearchParams();
    
    if (searchTerm) params.append('searchTerm', searchTerm);
    if (status) params.append('status', status);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return axiosInstance.get(url);
  }
}

export default new SupplierService();