const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stage1Data = sequelize.define('Stage1Data', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    job_no: DataTypes.STRING,
    job_date: DataTypes.DATE,
    edi_job_no: DataTypes.STRING,
    edi_date: DataTypes.DATE,
    consignee: DataTypes.STRING,
    shipper: DataTypes.STRING,
    port_of_discharge: DataTypes.STRING,
    final_place_of_delivery: DataTypes.STRING,
    port_of_loading: DataTypes.STRING,
    country_of_shipment: DataTypes.STRING,
    hbl_no: DataTypes.STRING,
    hbl_date: DataTypes.DATE,
    mbl_no: DataTypes.STRING,
    mbl_date: DataTypes.DATE,
    shipping_line: DataTypes.STRING,
    forwarder: DataTypes.STRING,
    weight: DataTypes.FLOAT,
    packages: DataTypes.INTEGER,
    invoice_no: DataTypes.STRING,
    invoice_date: DataTypes.DATE,
    gateway_igm: DataTypes.STRING,
    gateway_igm_date: DataTypes.DATE,
    local_igm: DataTypes.STRING,
    local_igm_date: DataTypes.DATE,
    commodity: DataTypes.STRING,
    eta: DataTypes.DATE,
    current_status: DataTypes.STRING,
    container_no: DataTypes.STRING,
    container_size: DataTypes.STRING,
    date_of_arrival: DataTypes.DATE,
    invoice_pl_doc: DataTypes.STRING,
    bl_doc: DataTypes.STRING,
    coo_doc: DataTypes.STRING,
    created_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'stage1_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Stage1Data;
};