require('dotenv').config();
const { sequelize, PipelineJob, Stage2Data } = require('../models');

async function checkStage2Data() {
  try {
    console.log('=== CHECKING STAGE 2 DATA DETAILS ===\n');
    
    // Get all Stage2Data records
    const stage2Records = await Stage2Data.findAll({
      include: [{ model: PipelineJob, as: 'PipelineJob' }]
    });
    
    console.log(`Total Stage2Data records: ${stage2Records.length}\n`);
    
    stage2Records.forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`- ID: ${record.id}`);
      console.log(`- Job ID: ${record.job_id}`);
      console.log(`- Job No: ${record.PipelineJob?.job_no}`);
      console.log(`- HSN Code: "${record.hsn_code}"`);
      console.log(`- Documents Type: "${record.documents_type}"`);
      console.log(`- Duty Amount: ${record.duty_amount}`);
      console.log(`- IRN No: "${record.irn_no}"`);
      console.log(`- Filing Requirement: "${record.filing_requirement}"`);
      console.log(`- Bill of Entry No: "${record.bill_of_entry_no}"`);
      console.log(`- Debit Note: "${record.debit_note}"`);
      console.log(`- Debit Paid By: "${record.debit_paid_by}"`);
      console.log(`- Ocean Freight: ${record.ocean_freight}`);
      console.log(`- Destination Charges: ${record.destination_charges}`);
      console.log(`- DRN No: "${record.drn_no}"`);
      console.log(`- Created At: ${record.createdAt}`);
      console.log(`- Updated At: ${record.updatedAt}`);
      console.log('---');
    });
    
    // Check specific job JOB-2024-001
    const specificJob = await PipelineJob.findOne({
      where: { job_no: 'JOB-2024-001' },
      include: [{ model: Stage2Data, as: 'Stage2' }]
    });
    
    if (specificJob && specificJob.Stage2) {
      console.log('\n=== DETAILED CHECK FOR JOB-2024-001 ===');
      console.log('Raw Stage2 data:', JSON.stringify(specificJob.Stage2.toJSON(), null, 2));
    }
    
  } catch (error) {
    console.error('Error in check:', error);
  } finally {
    await sequelize.close();
  }
}

checkStage2Data();
