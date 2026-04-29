import express from "express";
import { authMiddleware } from "../middlewares/Authentication.js";
import { requireAdmin } from "../middlewares/Authorization.js";
import APIConfig from "../models/APIConfig.js";

const router = express.Router();

// ✅ Get current API configuration (Admin only)
router.get("/current", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const config = await APIConfig.findOne({ isActive: true })
      .populate("createdBy", "name email")
      .populate("lastUpdatedBy", "name email");

    if (!config) {
      return res.status(404).json({ msg: "No active API configuration found" });
    }

    // Don't send the API key to frontend (security)
    const safeConfig = {
      _id: config._id,
      apiName: config.apiName,
      apiSource: config.apiSource,
      isActive: config.isActive,
      description: config.description,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      createdBy: config.createdBy,
      lastUpdatedBy: config.lastUpdatedBy,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };

    res.json(safeConfig);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching API configuration", error: error.message });
  }
});

// ✅ Get all API configurations history (Admin only)
router.get("/history", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const configs = await APIConfig.find()
      .populate("createdBy", "name email")
      .populate("lastUpdatedBy", "name email")
      .sort({ createdAt: -1 });

    // Don't send API keys
    const safeConfigs = configs.map((config) => ({
      _id: config._id,
      apiName: config.apiName,
      apiSource: config.apiSource,
      isActive: config.isActive,
      createdBy: config.createdBy,
      lastUpdatedBy: config.lastUpdatedBy,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));

    res.json(safeConfigs);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching history", error: error.message });
  }
});

// ✅ Create new API configuration (Admin only)
router.post("/create", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { apiKey, apiSource, apiName, description, timeout, retryAttempts } = req.body;

    // Validate required fields
    if (!apiKey || !apiSource) {
      return res.status(400).json({ msg: "API Key and API Source are required" });
    }

    // Check if URL is valid
    try {
      new URL(apiSource);
    } catch (err) {
      return res.status(400).json({ msg: "Invalid API Source URL" });
    }

    // Deactivate all previous configs
    await APIConfig.updateMany({}, { isActive: false });

    // Create new config
    const newConfig = new APIConfig({
      apiKey,
      apiSource,
      apiName: apiName || "External Peda API",
      description: description || "",
      timeout: timeout || 5000,
      retryAttempts: retryAttempts || 3,
      createdBy: req.user.id,
      isActive: true,
    });

    await newConfig.save();

    res.status(201).json({
      msg: "API configuration created successfully",
      config: {
        _id: newConfig._id,
        apiName: newConfig.apiName,
        apiSource: newConfig.apiSource,
        isActive: newConfig.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Error creating API configuration", error: error.message });
  }
});

// ✅ Update API configuration (Admin only)
router.put("/update/:configId", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { configId } = req.params;
    const { apiKey, apiSource, apiName, description, timeout, retryAttempts } = req.body;

    // Find config
    const config = await APIConfig.findById(configId);

    if (!config) {
      return res.status(404).json({ msg: "API configuration not found" });
    }

    // Validate API source if provided
    if (apiSource) {
      try {
        new URL(apiSource);
      } catch (err) {
        return res.status(400).json({ msg: "Invalid API Source URL" });
      }
    }

    // Update fields
    if (apiKey) config.apiKey = apiKey;
    if (apiSource) config.apiSource = apiSource;
    if (apiName) config.apiName = apiName;
    if (description !== undefined) config.description = description;
    if (timeout) config.timeout = timeout;
    if (retryAttempts) config.retryAttempts = retryAttempts;

    config.lastUpdatedBy = req.user.id;

    await config.save();

    res.json({
      msg: "API configuration updated successfully",
      config: {
        _id: config._id,
        apiName: config.apiName,
        apiSource: config.apiSource,
        isActive: config.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Error updating API configuration", error: error.message });
  }
});

// ✅ Activate a configuration (Admin only)
router.put("/activate/:configId", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { configId } = req.params;

    // Deactivate all previous configs
    await APIConfig.updateMany({}, { isActive: false });

    // Activate selected config
    const config = await APIConfig.findByIdAndUpdate(
      configId,
      { isActive: true, lastUpdatedBy: req.user.id },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ msg: "API configuration not found" });
    }

    res.json({
      msg: "API configuration activated",
      config: {
        _id: config._id,
        apiName: config.apiName,
        isActive: config.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ msg: "Error activating configuration", error: error.message });
  }
});

// ✅ Delete API configuration (Admin only)
router.delete("/delete/:configId", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { configId } = req.params;

    const config = await APIConfig.findByIdAndDelete(configId);

    if (!config) {
      return res.status(404).json({ msg: "API configuration not found" });
    }

    res.json({ msg: "API configuration deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Error deleting API configuration", error: error.message });
  }
});

// ✅ Test API connection (Admin only - to verify config works)
router.post("/test", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const config = await APIConfig.findOne({ isActive: true });

    if (!config) {
      return res.status(404).json({ msg: "No active API configuration" });
    }

    try {
      // Test the API connection with a simple request
      const response = await fetch(config.apiSource, {
        method: "GET",
        timeout: config.timeout,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`,
        },
      });

      if (response.ok) {
        res.json({
          msg: "API connection successful",
          statusCode: response.status,
          isConnected: true,
        });
      } else {
        res.json({
          msg: "API responded with error",
          statusCode: response.status,
          isConnected: false,
        });
      }
    } catch (apiError) {
      res.status(503).json({
        msg: "Failed to connect to API",
        error: apiError.message,
        isConnected: false,
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "Error testing API", error: error.message });
  }
});

export default router;
