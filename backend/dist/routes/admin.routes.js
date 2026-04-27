"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assignment_controller_1 = require("../controllers/assignment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Only Admins can trigger auto-assignment
router.post('/run', auth_middleware_1.authenticateJWT, auth_middleware_1.isAdmin, assignment_controller_1.runAutoAssignment);
exports.default = router;
