"use client";
import { useState } from 'react';

export default function StageDetailsModal({ isOpen, onClose, stage, stageData, stageNumber, stageName }) {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '';
    return `₹${parseFloat(amount).toLocaleString()}`;
  };

  const renderStageContent = () => {
    if (!stageData) {
      return (
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">📋</span>
          <p className="text-gray-600">No data available for this stage</p>
        </div>
      );
    }

    switch (stage) {
      case 'stage1':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Job No</p>
                <p className="text-sm text-gray-900">{stageData.job_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Job Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.job_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">EDI Job No</p>
                <p className="text-sm text-gray-900">{stageData.edi_job_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">EDI Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.edi_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Consignee</p>
                <p className="text-sm text-gray-900">{stageData.consignee || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Shipper</p>
                <p className="text-sm text-gray-900">{stageData.shipper || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Port of Discharge</p>
                <p className="text-sm text-gray-900">{stageData.port_of_discharge || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Final Place of Delivery</p>
                <p className="text-sm text-gray-900">{stageData.final_place_of_delivery || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Port of Loading</p>
                <p className="text-sm text-gray-900">{stageData.port_of_loading || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Country of Shipment</p>
                <p className="text-sm text-gray-900">{stageData.country_of_shipment || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">HBL No</p>
                <p className="text-sm text-gray-900">{stageData.hbl_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">HBL Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.hbl_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">MBL No</p>
                <p className="text-sm text-gray-900">{stageData.mbl_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">MBL Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.mbl_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Shipping Line</p>
                <p className="text-sm text-gray-900">{stageData.shipping_line || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Forwarder</p>
                <p className="text-sm text-gray-900">{stageData.forwarder || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Weight</p>
                <p className="text-sm text-gray-900">{stageData.weight || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Packages</p>
                <p className="text-sm text-gray-900">{stageData.packages || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Invoice No</p>
                <p className="text-sm text-gray-900">{stageData.invoice_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Invoice Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.invoice_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Gateway IGM</p>
                <p className="text-sm text-gray-900">{stageData.gateway_igm || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Gateway IGM Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.gateway_igm_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Local IGM</p>
                <p className="text-sm text-gray-900">{stageData.local_igm || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Local IGM Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.local_igm_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Commodity</p>
                <p className="text-sm text-gray-900">{stageData.commodity || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">ETA</p>
                <p className="text-sm text-gray-900">{stageData.eta ? new Date(stageData.eta).toLocaleString() : ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Current Status</p>
                <p className="text-sm text-gray-900">{stageData.current_status || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Container No</p>
                <p className="text-sm text-gray-900">{stageData.container_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Container Size</p>
                <p className="text-sm text-gray-900">{stageData.container_size || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date of Arrival</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.date_of_arrival)}</p>
              </div>
            </div>
          </div>
        );

      case 'stage2':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">HSN Code</p>
                <p className="text-sm text-gray-900">{stageData.hsn_code || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Documents Type</p>
                <p className="text-sm text-gray-900">{stageData.documents_type || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Filing Requirement</p>
                <p className="text-sm text-gray-900">{stageData.filing_requirement || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Checklist Sent</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.checklist_sent_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.approval_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Bill of Entry No</p>
                <p className="text-sm text-gray-900">{stageData.bill_of_entry_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Bill of Entry Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.bill_of_entry_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Duty Amount</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.duty_amount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Duty Paid By</p>
                <p className="text-sm text-gray-900">{stageData.duty_paid_by || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ocean Freight</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.ocean_freight)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Destination Charges</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.destination_charges)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">DRN No</p>
                <p className="text-sm text-gray-900">{stageData.drn_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">IRN No</p>
                <p className="text-sm text-gray-900">{stageData.irn_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Debit Note</p>
                <p className="text-sm text-gray-900">{stageData.debit_note || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Debit Paid By</p>
                <p className="text-sm text-gray-900">{stageData.debit_paid_by || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Original Documents Received Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.original_doct_recd_date)}</p>
              </div>
            </div>
          </div>
        );

      case 'stage3':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Exam Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.exam_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Charge</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.out_of_charge)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Clearance Expenses</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.clearance_exps)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Stamp Duty</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.stamp_duty)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Custodian</p>
                <p className="text-sm text-gray-900">{stageData.custodian || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Offloading Charges</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.offloading_charges)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Transport Detention</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.transport_detention)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Dispatch Info</p>
                <p className="text-sm text-gray-900">{stageData.dispatch_info || ''}</p>
              </div>
            </div>
            
            {/* Containers */}
            {stageData.containers && stageData.containers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Containers</h3>
                <div className="space-y-3">
                  {stageData.containers.map((container, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Container No</p>
                          <p className="text-sm text-gray-900">{container.container_no || ''}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Size</p>
                          <p className="text-sm text-gray-900">{container.size || ''}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Vehicle No</p>
                          <p className="text-sm text-gray-900">{container.vehicle_no || ''}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Date of Offloading</p>
                          <p className="text-sm text-gray-900">{formatDate(container.date_of_offloading)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'stage4':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Bill No</p>
                <p className="text-sm text-gray-900">{stageData.bill_no || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Bill Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.bill_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Taxable</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.amount_taxable)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">GST 5%</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.gst_5_percent)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">GST 18%</p>
                <p className="text-sm text-gray-900">{formatCurrency(stageData.gst_18_percent)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Bill Mail</p>
                <p className="text-sm text-gray-900">{stageData.bill_mail || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Bill Courier</p>
                <p className="text-sm text-gray-900">{stageData.bill_courier || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Courier Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.courier_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Acknowledge Date</p>
                <p className="text-sm text-gray-900">{formatDate(stageData.acknowledge_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Acknowledge Name</p>
                <p className="text-sm text-gray-900">{stageData.acknowledge_name || ''}</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Unknown stage</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Stage {stageNumber}: {stageName} - Complete Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {renderStageContent()}
        </div>
        
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 