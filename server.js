require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { sequelize } = require("./models");

// =========================
// Routes
// =========================

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const articleRoutes = require("./routes/articleRoutes");
const projectRoutes = require("./routes/projectRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const heroSlideRoutes = require("./routes/heroSlideRoutes");
const settingsRoutes = require("./routes/settingRoutes");
const orderRoutes = require("./routes/orderRoutes");
const pushRoutes = require("./routes/pushRoutes");
const applySeoRoute = require('./seo-apply-route');

const serviceCategoriesRoutes = require("./routes/serviceCategories");
const workSectionRoutes = require("./routes/workSectionRoutes");

// =========================
// App
// =========================

const app = express();

// Hostinger / Reverse Proxy
app.set("trust proxy", 1);

// =========================
// CORS
// =========================

// الموقع والـ API على نفس الدومين.
// السماح بالدومين الأساسي و www فقط.

app.use(
  cors({
    origin: [
      "https://rowadalthil.com",
      "https://www.rowadalthil.com"
    ],
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ],
    credentials: true
  })
);

// التعامل مع طلبات OPTIONS
app.options("/{*splat}", cors());

// =========================
// Body Parser
// =========================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);
app.use('/api', applySeoRoute);
// =========================
// Uploaded Images
// =========================

// الصور المرفوعة من لوحة التحكم
// public/uploads/image.jpg
// تصبح:
// https://rowadalthil.com/uploads/image.jpg

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "public", "uploads")
  )
);

// =========================
// Static Files
// =========================

// =========================
// Static Files + Performance
// =========================

const staticOptions = {
  maxAge: "30d",
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Cache للصور والخطوط والملفات الثابتة
    if (
      /\.(jpg|jpeg|png|webp|avif|gif|svg|ico|woff|woff2|ttf|otf)$/i.test(
        filePath
      )
    ) {
      res.setHeader(
        "Cache-Control",
        "public, max-age=2592000, immutable"
      );
    }

    // Cache للـ CSS و JS
    if (/\.(css|js)$/i.test(filePath)) {
      res.setHeader(
        "Cache-Control",
        "public, max-age=2592000"
      );
    }
  }
};

// public/
app.use(
  express.static(
    path.join(__dirname, "public"),
    staticOptions
  )
);

// ملفات المشروع الرئيسية
app.use(
  express.static(
    __dirname,
    staticOptions
  )
);

// =========================
// Pages
// =========================

console.log("📂 SERVER DIRECTORY:", __dirname);
console.log("📄 INDEX FILE:", path.join(__dirname, "index.html"));

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

// index.html
app.get("/index.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

// لوحة التحكم
app.get("/admin", (req, res) => {
  res.sendFile(
    path.join(__dirname, "admin.html")
  );
});

// المتجر
app.get("/store", (req, res) => {
  res.sendFile(
    path.join(__dirname, "store.html")
  );
});

// السلة
app.get("/cart", (req, res) => {
  res.sendFile(
    path.join(__dirname, "cart.html")
  );
});

// صفحات الأعمال
app.get("/work/:slug", (req, res) => {
  res.sendFile(
    path.join(__dirname, "work.html")
  );
});

// =========================
// API Routes
// =========================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/articles",
  articleRoutes
);

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/services",
  serviceRoutes
);

app.use(
  "/api/hero-slides",
  heroSlideRoutes
);

app.use(
  "/api/settings",
  settingsRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/push",
  pushRoutes
);

app.use(
  "/api/service-categories",
  serviceCategoriesRoutes
);

app.use(
  "/api/work-sections",
  workSectionRoutes
);

// =========================
// API 404 Handler
// =========================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl
  });
});

// =========================
// General Error Handler
// =========================

app.use(
  (err, req, res, next) => {
    console.error("❌ Server Error:");
    console.error(err);

    res.status(500).json({
      success: false,
      message: "حدث خطأ داخلي في السيرفر",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : undefined
    });
  }
);

// =========================
// Server
// =========================

// Hostinger هي التي تحدد PORT
const PORT =
  process.env.PORT || 4000;

const HOST = "0.0.0.0";

// =========================
// Database Connection
// =========================

sequelize.sync({ alter: true })
  .then(() => {
    console.log("=================================");
    console.log("✅ Database connected");
    console.log("=================================");

    app.listen(
      PORT,
      HOST,
      () => {
        console.log(
          "🚀 Server started successfully"
        );

        console.log(
          "📡 Port: " + PORT
        );

        console.log(
          "🌐 Website: https://rowadalthil.com"
        );

        console.log(
          "🛠️ Admin: https://rowadalthil.com/admin"
        );

        console.log(
          "🛍️ Store: https://rowadalthil.com/store"
        );

        console.log(
          "🛒 Cart: https://rowadalthil.com/cart"
        );

        console.log(
          "📦 API: https://rowadalthil.com/api"
        );

        console.log(
          "================================="
        );
      }
    );
  })
  .catch((err) => {
    console.error(
      "❌ Failed to connect to database:"
    );

    console.error(err);

    process.exit(1);
  });
