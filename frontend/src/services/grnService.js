import axiosInstance from "../api/axios";

class GRNService {
  // Existing methods...
  createGRN(data) {
    return axiosInstance.post("/warehouse/grn", data);
  }

  getAllGRN() {
    return axiosInstance.get("/warehouse/grn");
  }

  getGRNById(id) {
    return axiosInstance.get(`/warehouse/grn/${id}`);
  }

  updateStatus(id, status) {
    return axiosInstance.patch(`/warehouse/grn/${id}/status?status=${status}`);
  }

  // Inspection methods
  getGRNInspection(id) {
    return axiosInstance.get(`/warehouse/grn/${id}/inspection`);
  }

  submitInspection(id, data) {
    return axiosInstance.post(`/warehouse/grn/${id}/inspection`, data);
  }

  // New: Get inspection report
  getInspectionReport(id) {
    return axiosInstance.get(`/warehouse/grn/${id}/inspection/report`, {
      responseType: 'blob' // For PDF download
    });
  }

  // New: Get inspection history
  getInspectionHistory(partId) {
    return axiosInstance.get(`/warehouse/inspection/history/${partId}`);
  }

  // New: Download inspection certificate
  downloadInspectionCertificate(id) {
    return axiosInstance.get(`/warehouse/grn/${id}/inspection/certificate`, {
      responseType: 'blob'
    });
  }
}

export default new GRNService();