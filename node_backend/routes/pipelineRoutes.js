// routes/pipelineRoutes.js
const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/pipelineController');
const { attachment } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
// Apply auth middleware to all pipeline routes
router.use(attachment);

// Job routes
router.get('/jobs', pipelineController.getAllJobs);
router.get('/myjobs', pipelineController.getMyJobs);
router.get('/jobs/:id', pipelineController.getJobById);
router.post('/jobs', pipelineController.createJob);
router.put('/jobs/:id', pipelineController.updateJob);
router.post('/jobs/:id/stage2', pipelineController.updateStage2);
router.post('/jobs/:id/stage3', pipelineController.updateStage3);
router.post('/jobs/:id/stage4', pipelineController.updateStage4);
router.get('/jobs/:id/stage-history', pipelineController.getJobStageHistory);

// File routes
router.post('/files/upload', upload.single('file'), pipelineController.uploadFile);
router.get('/files/download/:id', pipelineController.downloadFile);
router.get('/files', pipelineController.getFiles);
router.delete('/files/:id', pipelineController.deleteFile);

module.exports = router;
