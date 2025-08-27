// scripts/seedDatabase.js
require('dotenv').config();
const { sequelize, User, PipelineJob, Stage1Data, Stage2Data, Stage3Data, Stage3Container, Stage4Data, JobUpdate, JobFile, Task, TaskAssignment, TaskUpdate } = require('../models');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // First, manually drop tables in correct order to avoid foreign key constraints
    const dropOrder = [
      'task_updates',
      'task_assignments',
      'tasks',
      'job_files',
      'job_updates',
      'stage4_data',
      'stage3_containers',
      'stage3_data',
      'stage2_data',
      'stage1_data',
      'pipeline_jobs',
      'users'
    ];

    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    for (const table of dropOrder) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.log(`Table ${table} doesn't exist or couldn't be dropped:`, error.message);
      }
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Now sync the database
    await sequelize.sync({ force: false });
    console.log('Database schema created successfully');

    // Create sample users
    const users = await User.bulkCreate([
      {
        username: 'admin',
        password_hash: '123456',
        designation: 'Administrator',
        is_admin: true,
        role: 'admin'
      },
      {
        username: 'stage1_emp',
        password_hash: '123456',
        designation: 'Job Creator',
        is_admin: false,
        role: 'stage1_employee'
      },
      {
        
        username: 'stage2_emp',
        password_hash: '123456',
        designation: 'Customs Officer',
        is_admin: false,
        role: 'stage2_employee'
      },
      {
        username: 'stage3_emp',
        password_hash: '123456',
        designation: 'Logistics Coordinator',
        is_admin: false,
        role: 'stage3_employee'
      },
      {
        username: 'customer1',
        password_hash: '123456',
        designation: 'Client',
        is_admin: false,
        role: 'customer'
      },
      {
        username: 'subadmin',
        password_hash: '123456',
        designation: 'Sub Administrator',
        is_admin: false,
        role: 'subadmin'
      }
    ], { returning: true });
    console.log('Sample users created');

    // Create sample pipeline jobs
    const jobs = await PipelineJob.bulkCreate([
      {
        job_no: 'JOB001',
        current_stage: 'stage1',
        status: 'active',
        created_by: users[1].id, // stage1_emp
        notification_email: 'customer1@example.com'
      },
      {
        job_no: 'JOB002',
        current_stage: 'stage2',
        status: 'active',
        created_by: users[0].id, // admin
        notification_email: 'customer2@example.com'
      },
      {
        job_no: 'JOB003',
        current_stage: 'stage3',
        status: 'active',
        created_by: users[5].id, // subadmin
        notification_email: 'customer3@example.com'
      }
    ], { returning: true });
    console.log('Sample pipeline jobs created');

    // Create sample stage1 data
    await Stage1Data.bulkCreate([
      {
        job_id: jobs[0].id,
        job_no: 'JOB001',
        job_date: new Date(),
        consignee: 'ABC Import Co.',
        shipper: 'XYZ Export Ltd.',
        port_of_discharge: 'Mumbai Port',
        final_place_of_delivery: 'New Delhi',
        port_of_loading: 'Shanghai Port',
        country_of_shipment: 'China',
        commodity: 'Electronics',
        current_status: 'Documents Received',
        weight: 1500.50,
        packages: 25,
        container_no: 'CAXU1234567',
        container_size: '40'
      },
      {
        job_id: jobs[1].id,
        job_no: 'JOB002',
        job_date: new Date(),
        consignee: 'DEF Trading Co.',
        shipper: 'GHI Manufacturers',
        commodity: 'Textiles',
        current_status: 'Processing',
        weight: 800.75,
        packages: 15
      }
    ]);
    console.log('Sample stage1 data created');

    // Create sample stage2 data
    await Stage2Data.bulkCreate([
      {
        job_id: jobs[1].id,
        hsn_code: '8541',
        filing_requirement: 'Standard Customs Declaration',
        duty_amount: 12500.00,
        ocean_freight: 8500.00,
        destination_charges: 3200.50
      }
    ]);
    console.log('Sample stage2 data created');

    // Create sample stage3 data
    await Stage3Data.bulkCreate([
      {
        job_id: jobs[2].id,
        exam_date: new Date(),
        clearance_exps: 4500.00,
        stamp_duty: 1200.00,
        custodian: 'Mumbai Logistics Ltd.',
        offloading_charges: 1800.00
      }
    ]);
    console.log('Sample stage3 data created');

    // Create sample stage3 containers
    await Stage3Container.bulkCreate([
      {
        job_id: jobs[2].id,
        container_no: 'TGHU7654321',
        size: '40',
        vehicle_no: 'MH01AB1234',
        date_of_offloading: new Date()
      },
      {
        job_id: jobs[2].id,
        container_no: 'CAXU9876543',
        size: '20',
        vehicle_no: 'MH02CD5678',
        date_of_offloading: new Date()
      }
    ]);
    console.log('Sample stage3 containers created');

    // Create sample job updates
    await JobUpdate.bulkCreate([
      {
        job_id: jobs[0].id,
        user_id: users[1].id,
        stage: 'stage1',
        update_type: 'status_change',
        message: 'Job created successfully'
      },
      {
        job_id: jobs[1].id,
        user_id: users[2].id,
        stage: 'stage2',
        update_type: 'data_update',
        message: 'Customs documentation submitted'
      },
      {
        job_id: jobs[2].id,
        user_id: users[3].id,
        stage: 'stage3',
        update_type: 'stage_completion',
        message: 'Clearance process started'
      }
    ]);
    console.log('Sample job updates created');

    // Create sample tasks (if Task model exists)
    try {
      const tasks = await Task.bulkCreate([
        {
          job_id: 'JOB001',
          description: 'Implement user authentication system',
          priority: 'High',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          job_id: 'JOB002',
          description: 'Design database schema for CRM',
          priority: 'Medium',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      ], { returning: true });

      await TaskAssignment.bulkCreate([
        {
          task_id: tasks[0].id,
          user_id: users[2].id
        },
        {
          task_id: tasks[1].id,
          user_id: users[3].id
        }
      ]);

      await TaskUpdate.bulkCreate([
        {
          task_id: tasks[0].id,
          user_id: users[2].id,
          status: 'In Progress',
          comment: 'Started working on authentication'
        },
        {
          task_id: tasks[1].id,
          user_id: users[3].id,
          status: 'Assigned',
          comment: 'Waiting for requirements'
        }
      ]);
      console.log('Sample tasks created');
    } catch (error) {
      console.log('Task models not available, skipping task creation');
    }

    console.log('Database seeding completed successfully!');
    console.log('\n=== Sample Login Credentials ===');
    console.log('Admin: admin / 123456');
    console.log('Stage1 Employee: stage1_emp / 123456');
    console.log('Stage2 Employee: stage2_emp / 123456');
    console.log('Stage3 Employee: stage3_emp / 123456');
    console.log('Customer: customer1 / 123456');
    console.log('Subadmin: subadmin / 123456');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the seed script
seedDatabase();
