const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/pipelineController.js');

router.get('/jobs', pipelineController.getAllJobs);
router.get('/myjobs', pipelineController.getMyJobs);
router.get('/jobs/:id', pipelineController.getJobById);
router.post('/jobs', pipelineController.createJob);
router.post('/jobs/:id/stage2', pipelineController.updateStage2);
router.post('/jobs/:id/stage3', pipelineController.updateStage3);
router.post('/jobs/:id/stage4', pipelineController.updateStage4);

router.post('/files/upload', pipelineController.uploadFile);
router.get('/files/download/:id', pipelineController.downloadFile);
router.get('/files', pipelineController.getFiles); 
router.delete('/files/:id', pipelineController.deleteFile);
module.exports = router;