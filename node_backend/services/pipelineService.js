const {
  PipelineJob,
  Stage1Data,
  Stage1Container,
  Stage2Data,
  Stage3Data,
  Stage3Container,
  Stage4Data,
  JobUpdate,
  JobFile,
  User,
} = require("../models");

class PipelineService {
  // Validate and convert stage 1 data types
  validateAndConvertStage1Data(data) {
    if (!data) {
      throw new Error('No data provided for stage 1');
    }

    // Ensure job_no is provided
    if (!data.job_no) {
      throw new Error('Job number is required');
    }

    // Convert date strings to Date objects if they exist
    const dateFields = [
      'job_date', 'edi_date', 'hbl_date', 'mbl_date', 
      'invoice_date', 'gateway_igm_date', 'local_igm_date',
      'eta', 'date_of_arrival'
    ];

    const result = { ...data };

    // Convert date strings to Date objects
    dateFields.forEach(field => {
      if (data[field]) {
        try {
          result[field] = new Date(data[field]);
        } catch (error) {
          console.warn(`Invalid date format for ${field}:`, data[field]);
          result[field] = null;
        }
      }
    });

    // Ensure numeric fields are numbers
    const numericFields = ['weight', 'packages'];
    numericFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null) {
        const num = Number(data[field]);
        if (!isNaN(num)) {
          result[field] = num;
        } else {
          console.warn(`Invalid number for ${field}:`, data[field]);
          result[field] = null;
        }
      }
    });

    // Process containers if they exist
    if (data.containers && Array.isArray(data.containers)) {
      result.containers = data.containers.map(container => ({
        container_no: container.container_no || null,
        container_size: container.container_size || '20',
        date_of_arrival: container.date_of_arrival ? new Date(container.date_of_arrival) : null
      }));
    }

    return result;
  }
  // Get all jobs with related data
  async getAllJobs() {
    try {
      console.log("getAllJobs called, finding all pipeline jobs...");
      const jobs = await PipelineJob.findAll({
        include: [
          {
            model: User,
            as: "CreatedByUser",
            attributes: ["username"],
          },
          {
            model: Stage1Data,
            as: "Stage1",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage1Container,
            as: "Stage1Containers",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage2Data,
            as: "Stage2",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage3Data,
            as: "Stage3",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          // CORRECTION: Stage3Container is directly associated with PipelineJob
          {
            model: Stage3Container,
            as: "Stage3Containers",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage4Data,
            as: "Stage4",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: JobUpdate,
            as: "Updates",
            include: [
              {
                model: User,
                as: "User",
                attributes: ["username"],
              },
            ],
            order: [["created_at", "DESC"]],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      console.log(`Found ${jobs.length} jobs successfully`);
      return jobs;
    } catch (error) {
      console.error("Error in getAllJobs service:", error);
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  }

  // Get stage history for a job (last 2 stages)
  async getJobStageHistory(jobId) {
    try {
      const stageHistory = await JobUpdate.findAll({
        where: { job_id: jobId },
        order: [['created_at', 'DESC']],
        limit: 2,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['username', 'role']
          }
        ]
      });
      
      return stageHistory;
    } catch (error) {
      console.error("Error getting stage history:", error);
      throw new Error(`Failed to get stage history: ${error.message}`);
    }
  }

  // Get job by ID with all related data
  async getJobById(jobId) {
    try {
      const job = await PipelineJob.findByPk(jobId, {
        include: [
          {
            model: User,
            as: "CreatedByUser",
            attributes: ["username"],
          },
          {
            model: Stage1Data,
            as: "Stage1",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage2Data,
            as: "Stage2",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage3Data,
            as: "Stage3",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          // CORRECTION: Stage3Container is directly associated with PipelineJob
          {
            model: Stage3Container,
            as: "Stage3Containers",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: Stage4Data,
            as: "Stage4",
            attributes: { exclude: ["created_at", "updated_at"] },
          },
          {
            model: JobUpdate,
            as: "Updates",
            include: [
              {
                model: User,
                as: "User",
                attributes: ["username", "role"],
              },
            ],
            order: [["created_at", "DESC"]],
            limit: 2,
          },
        ],
      });

      if (!job) {
        throw new Error("Job not found");
      }

      return job;
    } catch (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }
  }

  // Create new job with stage1 data
  async createJob(stage1Data, createdBy) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      console.log('Creating job with data:', JSON.stringify(stage1Data, null, 2));
      
      // Validate and convert data types
      const validatedData = this.validateAndConvertStage1Data(stage1Data);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      // All jobs go directly to stage 2
      const initialStage = "stage2";
      
      console.log('Creating pipeline job with:', {
        job_no: validatedData.job_no,
        current_stage: initialStage,
        status: "active",
        created_by: createdBy,
        assigned_to_stage2: validatedData.assigned_to_stage2 || null,
        assigned_to_stage3: validatedData.assigned_to_stage3 || null,
        customer_id: validatedData.customer_id || null,
        notification_email: validatedData.notification_email || null,
      });

      // Create the job in the appropriate stage
      const job = await PipelineJob.create(
        {
          job_no: validatedData.job_no,
          current_stage: initialStage,
          status: "active",
          created_by: createdBy,
          assigned_to_stage2: validatedData.assigned_to_stage2 || null,
          assigned_to_stage3: validatedData.assigned_to_stage3 || null,
          customer_id: validatedData.customer_id || null,
          notification_email: validatedData.notification_email || null,
        },
        { transaction }
      );
      
      console.log(`Job created in ${initialStage} with ID:`, job.id);

      console.log('Pipeline job created with ID:', job.id);

      // Create stage1 data
      console.log('Creating stage1 data with job_id:', job.id);
      const stage1Record = await Stage1Data.create(
        {
          job_id: job.id,
          job_no: validatedData.job_no,
          job_date: validatedData.job_date || null,
          edi_job_no: validatedData.edi_job_no || null,
          edi_date: validatedData.edi_date || null,
          consignee: validatedData.consignee || null,
          shipper: validatedData.shipper || null,
          port_of_discharge: validatedData.port_of_discharge || null,
          final_place_of_delivery: validatedData.final_place_of_delivery || null,
          port_of_loading: validatedData.port_of_loading || null,
          country_of_shipment: validatedData.country_of_shipment || null,
          hbl_no: validatedData.hbl_no || null,
          hbl_date: validatedData.hbl_date || null,
          mbl_no: validatedData.mbl_no || null,
          mbl_date: validatedData.mbl_date || null,
          shipping_line: validatedData.shipping_line || null,
          forwarder: validatedData.forwarder || null,
          weight: validatedData.weight || null,
          packages: validatedData.packages || null,
          invoice_no: validatedData.invoice_no || null,
          invoice_date: validatedData.invoice_date || null,
          gateway_igm: validatedData.gateway_igm || null,
          gateway_igm_date: validatedData.gateway_igm_date || null,
          local_igm: validatedData.local_igm || null,
          local_igm_date: validatedData.local_igm_date || null,
          commodity: validatedData.commodity || null,
          eta: validatedData.eta || null,
          current_status: validatedData.current_status || null,
          container_no: validatedData.container_no || null,
          container_size: validatedData.container_size || null,
          date_of_arrival: validatedData.date_of_arrival || null,
          created_by: createdBy,
          updated_by: createdBy
        },
        { transaction }
      );

      console.log('Stage1 data created with ID:', stage1Record.id);

      // Create containers if provided - only if container_no is not empty
      if (validatedData.containers && Array.isArray(validatedData.containers) && validatedData.containers.length > 0) {
        console.log('Processing containers:', validatedData.containers.length);
        for (const container of validatedData.containers) {
          if (container && typeof container === 'object' && container.container_no && container.container_no.trim() !== '') {
            console.log('Creating container:', container);
            await Stage1Container.create(
              {
                job_id: job.id,
                container_no: container.container_no,
                container_size: container.container_size || '20',
                date_of_arrival: container.date_of_arrival || null,
              },
              { transaction }
            );
          } else {
            console.log('Skipping empty container:', container);
          }
        }
      }

      // Add job update
      await JobUpdate.create(
        {
          job_id: job.id,
          user_id: createdBy,
          stage: "stage1",
          update_type: "status_change",
          message: "Job created",
        },
        { transaction }
      );

      await transaction.commit();
      console.log('Transaction committed successfully');

      // Return the complete job with all data
      return await this.getJobById(job.id);
    } catch (error) {
      console.error('Error in createJob:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      
      // Only rollback if transaction is still active
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  // Helper method to validate and convert stage1 data types
  validateAndConvertStage1Data(data) {
    const validated = { ...data };

    // Convert string numbers to actual numbers
    if (typeof validated.weight === 'string' && validated.weight !== '') {
      const weight = parseFloat(validated.weight);
      if (isNaN(weight)) {
        throw new Error('Invalid weight value. Must be a valid number.');
      }
      validated.weight = weight;
    }

    if (typeof validated.packages === 'string' && validated.packages !== '') {
      const packages = parseInt(validated.packages);
      if (isNaN(packages)) {
        throw new Error('Invalid packages value. Must be a valid integer.');
      }
      validated.packages = packages;
    }

    if (typeof validated.assigned_to_stage2 === 'string' && validated.assigned_to_stage2 !== '') {
      const assignedToStage2 = parseInt(validated.assigned_to_stage2);
      if (isNaN(assignedToStage2)) {
        throw new Error('Invalid assigned_to_stage2 value. Must be a valid integer.');
      }
      validated.assigned_to_stage2 = assignedToStage2;
    }

    if (typeof validated.assigned_to_stage3 === 'string' && validated.assigned_to_stage3 !== '') {
      const assignedToStage3 = parseInt(validated.assigned_to_stage3);
      if (isNaN(assignedToStage3)) {
        throw new Error('Invalid assigned_to_stage3 value. Must be a valid integer.');
      }
      validated.assigned_to_stage3 = assignedToStage3;
    }

    if (typeof validated.customer_id === 'string' && validated.customer_id !== '') {
      const customerId = parseInt(validated.customer_id);
      if (isNaN(customerId)) {
        throw new Error('Invalid customer_id value. Must be a valid integer.');
      }
      validated.customer_id = customerId;
    }

    // Validate required fields
    if (!validated.job_no || validated.job_no.trim() === '') {
      throw new Error('Job number is required');
    }

    // Convert empty strings to null for optional fields
    if (validated.weight === '') validated.weight = null;
    if (validated.packages === '') validated.packages = null;
    if (validated.assigned_to_stage2 === '') validated.assigned_to_stage2 = null;
    if (validated.assigned_to_stage3 === '') validated.assigned_to_stage3 = null;
    if (validated.customer_id === '') validated.customer_id = null;

    // Handle containers array validation
    if (validated.containers && Array.isArray(validated.containers)) {
      validated.containers = validated.containers.filter(container => 
        container && typeof container === 'object'
      );
    }

    // Log the final validated data for debugging
    console.log('Final validated data:', JSON.stringify(validated, null, 2));

    return validated;
  }

  // Update job
  async updateJob(jobId, updateData, userId) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      // Find the job
      const job = await PipelineJob.findByPk(jobId, { transaction });
      if (!job) {
        throw new Error("Job not found");
      }

      // Update pipeline job fields
      
      if (updateData.notification_email !== undefined) job.notification_email = updateData.notification_email;
      
      await job.save({ transaction });

      // Update stage1 data
      const stage1 = await Stage1Data.findOne({ where: { job_id: jobId }, transaction });
      if (stage1) {
        const stage1UpdateData = { ...updateData };

        delete stage1UpdateData.notification_email;
        delete stage1UpdateData.containers;

        await stage1.update(stage1UpdateData, { transaction });
      }

      // Update containers if provided
      if (updateData.containers && Array.isArray(updateData.containers)) {
        // Delete existing containers
        await Stage1Container.destroy({ where: { job_id: jobId }, transaction });

        // Create new containers
        for (const container of updateData.containers) {
          await Stage1Container.create(
            {
              job_id: jobId,
              container_no: container.container_no || '',
              container_size: container.container_size || '20',
              date_of_arrival: container.date_of_arrival || null,
            },
            { transaction }
          );
        }
      }

      // Add job update
      await JobUpdate.create(
        {
          job_id: jobId,
          user_id: userId,
          stage: "stage1",
          update_type: "data_update",
          message: "Job data updated",
        },
        { transaction }
      );

      await transaction.commit();

      // Return the complete job with all data
      return await this.getJobById(jobId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to update job: ${error.message}`);
    }
  }

  // Update stage1 data
  async updateStage1Data(jobId, stage1Data, userId) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      console.log("Updating Stage1 data for job:", jobId);
      console.log("Stage1 data payload:", stage1Data);

      // First, try to find existing stage1 data
      let stage1 = await Stage1Data.findOne({
        where: { job_id: jobId },
        transaction
      });

      if (stage1) {
        // Update existing stage1 data
        console.log("Updating existing stage1 data");
        await stage1.update({
          ...stage1Data,
          updated_by: userId
        }, { transaction });
      } else {
        // Create new stage1 data
        console.log("Creating new stage1 data");
        stage1 = await Stage1Data.create({
          job_id: jobId,
          ...stage1Data,
          created_by: userId,
          updated_by: userId
        }, { transaction });
      }

      await transaction.commit();
      console.log("Stage1 data updated successfully");

      // Return the complete job with all data
      return await this.getJobById(jobId);
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating stage1 data:", error);
      throw new Error(`Failed to update stage1 data: ${error.message}`);
    }
  }

  // Update stage2 data
  // services/pipelineService.js - Rewrite updateStage2Data method
  async updateStage2Data(jobId, stage2Data, userId) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      console.log("Updating Stage2 data for job:", jobId);
      console.log("Stage2 data payload:", stage2Data);

      // First, try to find existing stage2 data
      let stage2 = await Stage2Data.findOne({
        where: { job_id: jobId },
        transaction,
      });

      if (stage2) {
        // Update existing record
        console.log("Updating existing Stage2 data");
        await stage2.update({
          ...stage2Data,
          updated_by: userId
        }, { transaction });
      } else {
        // Create new record
        console.log("Creating new Stage2 data");
        stage2 = await Stage2Data.create(
          {
            job_id: jobId,
            ...stage2Data,
            created_by: userId,
            updated_by: userId
          },
          { transaction }
        );
      }

      // Update job stage to stage3 automatically after data is saved
      const job = await PipelineJob.findByPk(jobId, { transaction });
      console.log("Current job stage:", job.current_stage);
      
      const previousStage = job.current_stage;
      let newStage = "stage3";

      // Always move to stage3 when stage2 data is saved
      await job.update({ current_stage: "stage3" }, { transaction });
      console.log("Updated job stage to stage3");

      // Get stage history (last 2 stages)
      const stageHistory = await JobUpdate.findAll({
        where: { job_id: jobId },
        order: [['created_at', 'DESC']],
        limit: 2,
        transaction
      });

      // Add job update with previous stage info
      await JobUpdate.create(
        {
          job_id: jobId,
          user_id: userId,
          stage: "stage2",
          update_type: "stage_completion",
          message: `Stage 2 completed - Automatically moved to Stage 3`,
          old_value: previousStage,
          new_value: "stage3",
          previous_stage: previousStage,
          stage_history: stageHistory.map(update => ({
            stage: update.stage,
            message: update.message,
            created_at: update.created_at,
            user_id: update.user_id
          }))
        },
        { transaction }
      );

      // Commit the transaction
      // Commit the transaction first
      await transaction.commit();
      console.log("Transaction committed successfully");

      // Verify the data was saved
      const savedStage2 = await Stage2Data.findOne({
        where: { job_id: jobId },
      });
      console.log(
        "Saved Stage2 data:",
        savedStage2 ? savedStage2.toJSON() : "Not found"
      );

      // Return the complete job with all data (after commit)
      return await this.getJobById(jobId);
    } catch (error) {
      // Rollback transaction on error (only if not committed)
      if (transaction.finished !== 'commit') {
        await transaction.rollback();
      }
      throw error;
    }
  }

  // Update stage3 data
  async updateStage3Data(jobId, stage3Data, userId) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      // Prepare data with proper type conversion
      const processedData = {
        ...stage3Data,
        // Convert string numbers to float for monetary values
        clearance_exps: stage3Data.clearance_exps ? parseFloat(stage3Data.clearance_exps) : null,
        stamp_duty: stage3Data.stamp_duty ? parseFloat(stage3Data.stamp_duty) : null,
        offloading_charges: stage3Data.offloading_charges ? parseFloat(stage3Data.offloading_charges) : null,
        transport_detention: stage3Data.transport_detention ? parseFloat(stage3Data.transport_detention) : null,
        // Convert date strings to Date objects
        exam_date: stage3Data.exam_date ? new Date(stage3Data.exam_date) : null,
        out_of_charge: stage3Data.out_of_charge ? new Date(stage3Data.out_of_charge) : null
      };

      // Validate numeric fields
      const numericFields = [
        'clearance_exps', 
        'stamp_duty', 
        'offloading_charges', 
        'transport_detention'
      ];

      for (const field of numericFields) {
        if (processedData[field] !== null && isNaN(processedData[field])) {
          throw new Error(`Invalid value for ${field}: ${stage3Data[field]}`);
        }
      }

      // Find or create stage3 data
      const [stage3, created] = await Stage3Data.findOrCreate({
        where: { job_id: jobId },
        defaults: {
          job_id: jobId,
          ...processedData,
          created_by: userId,
          updated_by: userId
        },
        transaction,
      });

      if (!created) {
        await stage3.update({
          ...processedData,
          updated_by: userId
        }, { transaction });
      }

      // Delete existing containers and add new ones
      await Stage3Container.destroy({
        where: { job_id: jobId },
        transaction,
      });

      if (stage3Data.containers && stage3Data.containers.length > 0) {
        for (const container of stage3Data.containers) {
          await Stage3Container.create(
            {
              job_id: jobId,
              container_no: container.container_no,
              size: container.size,
              vehicle_no: container.vehicle_no,
              date_of_offloading: container.date_of_offloading,
              empty_return_date: container.empty_return_date,
            },
            { transaction }
          );
        }
      }

      // Update job stage
      const job = await PipelineJob.findByPk(jobId, { transaction });
      const previousStage = job.current_stage;
      
      // If stage3 data is being entered, move to stage4 (customer stage)
      const newStage = "stage4";
      await job.update({ current_stage: newStage }, { transaction });
      
      // Create empty stage4 data record for the customer
      await Stage4Data.findOrCreate({
        where: { job_id: jobId },
        defaults: {
          job_id: jobId,
          // Initialize with empty values or default values as needed
          acknowledge_date: null,
          // Add other stage4 fields with default values if needed
        },
        transaction,
      });

      // Get stage history (last 2 stages)
      const stageHistory = await JobUpdate.findAll({
        where: { job_id: jobId },
        order: [['created_at', 'DESC']],
        limit: 2,
        transaction
      });

      // Add job update with previous stage info
      await JobUpdate.create(
        {
          job_id: jobId,
          user_id: userId,
          stage: "stage3",
          update_type: "stage_change",
          message: `Stage changed from ${previousStage} to ${newStage}`,
          previous_stage: previousStage,
          stage_history: stageHistory.map(update => ({
            stage: update.stage,
            message: update.message,
            created_at: update.created_at,
            user_id: update.user_id
          }))
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getJobById(jobId);
    } catch (error) {
      // Rollback transaction on error (only if not committed)
      if (transaction.finished !== 'commit') {
        await transaction.rollback();
      }
      throw new Error(`Failed to update stage 3 data: ${error.message}`);
    }
  }

  // Update stage4 data
  async updateStage4Data(jobId, stage4Data, userId) {
    const transaction = await PipelineJob.sequelize.transaction();

    try {
      // Find or create stage4 data
      const [stage4, created] = await Stage4Data.findOrCreate({
        where: { job_id: jobId },
        defaults: {
          job_id: jobId,
          ...stage4Data,
          created_by: userId,
          updated_by: userId
        },
        transaction,
      });

      if (!created) {
        await stage4.update({
          ...stage4Data,
          updated_by: userId
        }, { transaction });
      }

      // Update job stage to stage4 or completed
      const job = await PipelineJob.findByPk(jobId, { transaction });
      const previousStage = job.current_stage;
      let newStage = "stage4";
      if (stage4Data.acknowledge_date) {
        newStage = "completed";
      }

      await job.update({ current_stage: newStage }, { transaction });

      // Get stage history (last 2 stages)
      const stageHistory = await JobUpdate.findAll({
        where: { job_id: jobId },
        order: [['created_at', 'DESC']],
        limit: 2,
        transaction
      });

      // Add job update with previous stage info
      const message =
        newStage === "completed" ? "Job completed" : "Stage 4 data updated";
      await JobUpdate.create(
        {
          job_id: jobId,
          user_id: userId,
          stage: "stage4",
          update_type: "stage_change",
          message: message,
          previous_stage: previousStage,
          stage_history: stageHistory.map(update => ({
            stage: update.stage,
            message: update.message,
            created_at: update.created_at,
            user_id: update.user_id
          }))
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getJobById(jobId);
    } catch (error) {
      // Rollback transaction on error (only if not committed)
      if (transaction.finished !== 'commit') {
        await transaction.rollback();
      }
      throw new Error(`Failed to update stage 4 data: ${error.message}`);
    }
  }

  // Get jobs by current stage
  async getJobsByCurrentStage(stage) {
    try {
      return await PipelineJob.findAll({
        where: { current_stage: stage },
        include: this.getJobIncludes(),
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      throw new Error(`Failed to fetch jobs by stage ${stage}: ${error.message}`);
    }
  }

  // Get jobs by creator (stage1 employee)
  async getJobsByCreator(userId) {
    try {
      return await PipelineJob.findAll({
        where: { created_by: userId },
        include: this.getJobIncludes(),
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      throw new Error(`Failed to fetch jobs by creator: ${error.message}`);
    }
  }



  // Helper method for job includes

  getJobIncludes() {
    return [
      {
        model: User,
        as: "CreatedByUser",
        attributes: ["username"],
      },
      {
        model: Stage1Data,
        as: "Stage1", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
      {
        model: Stage2Data,
        as: "Stage2", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
      {
        model: Stage3Data,
        as: "Stage3", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
      {
        model: Stage3Container,
        as: "Stage3Containers", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
      {
        model: Stage4Data,
        as: "Stage4", // Add the alias
        attributes: { exclude: ["created_at", "updated_at"] },
      },
    ];
  }
  // File upload methods
  async uploadFile(fileData) {
    try {
      const file = await JobFile.create(fileData);

      // Add job update
      await JobUpdate.create({
        job_id: fileData.job_id,
        user_id: fileData.uploaded_by,
        stage: fileData.stage,
        update_type: "file_upload",
        message: `File uploaded: ${fileData.original_name}`,
        new_value: fileData.file_name,
      });

      return await this.getFileById(file.id);
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async getFilesByJobAndStage(jobId, stage) {
    try {
      return await JobFile.findAll({
        where: { job_id: jobId, stage },
        include: [
          {
            model: User,
            as: "UploadedByUser",
            attributes: ["username"],
          },
        ],
        order: [["created_at", "DESC"]],
      });
    } catch (error) {
      throw new Error(`Failed to get files: ${error.message}`);
    }
  }

  async getFileById(fileId) {
    try {
      const file = await JobFile.findByPk(fileId, {
        include: [
          {
            model: User,
            as: "UploadedByUser",
            attributes: ["username"],
          },
        ],
      });

      if (!file) {
        throw new Error("File not found");
      }

      return file;
    } catch (error) {
      throw new Error(`Failed to get file: ${error.message}`);
    }
  }

  async deleteFile(fileId, userId) {
    try {
      const file = await this.getFileById(fileId);

      // Check if user has permission to delete
      if (file.uploaded_by !== userId) {
        throw new Error("Unauthorized to delete this file");
      }

      await file.destroy();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}

module.exports = new PipelineService();
