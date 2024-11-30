const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const mongoose = require("mongoose");
const Session = require("./models/Session"); // استيراد نموذج الجلسة
const cors = require("cors");
const toolsConfig = require("./toolsConfig"); // استيراد إعداد الأدوات

// تفعيل مكون التخفي لتجنب كشف الروبوت
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد CORS للسماح بطلبات من نطاقات محددة
const allowedOrigins = ["chrome-extension://imhiiignfblghjjhpjfpgedinddaobjf"]; // استبدال بالامتداد الخاص بك
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

// الاتصال بقاعدة البيانات MongoDB
const MONGODB_URI =
  "mongodb+srv://sherif_hzaimia:ch0793478417@cluster0.oth1w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("تم الاتصال بقاعدة البيانات بنجاح"))
  .catch((error) => console.error("فشل الاتصال بقاعدة البيانات:", error));

// وظيفة تسجيل الدخول وتخزين الجلسة في قاعدة البيانات
async function loginAndSaveSession(toolName) {
  const tool = toolsConfig[toolName];
  if (!tool) {
    return { success: false, error: "الأداة غير موجودة في التكوين" };
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(tool.baseUrl, { waitUntil: "networkidle2" });
    await page.type(tool.usernameSelector, tool.credentials.username);
    await page.type(tool.passwordSelector, tool.credentials.password);

    await Promise.all([
      page.click(tool.loginButtonSelector),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    const cookies = await page.cookies();
    const sessionCookie = cookies.find(
      (cookie) => cookie.name === tool.sessionCookieName
    );

    if (!sessionCookie) {
      throw new Error("تعذر العثور على كوكيز الجلسة للأداة " + toolName);
    }

    // حفظ الجلسة في قاعدة البيانات
    const newSession = new Session({
      name: sessionCookie.name,
      value: sessionCookie.value,
      domain: sessionCookie.domain,
      path: sessionCookie.path || "/",
      expires: sessionCookie.expires || -1,
      httpOnly: sessionCookie.httpOnly || true,
      secure: sessionCookie.secure || true
    });
    
    const savedSession = await newSession.save();

    return {
      success: true,
      token: savedSession
    };
  } catch (error) {
    console.error(`Error logging in to ${toolName}:`, error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await browser.close();
  }
}

// API: بدء الجلسة للأداة المطلوبة وحفظها في قاعدة البيانات
app.get("/start-session/:toolName", async (req, res) => {
  const toolName = req.params.toolName;

  try {
    const result = await loginAndSaveSession(toolName);
    if (result.success) {
      res.json({
        success: true,
        token: result.token
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "حدث خطأ أثناء استخراج الجلسة للأداة " + toolName,
    });
  }
});

// API: استرجاع الجلسة المخزنة للأداة المطلوبة من قاعدة البيانات
app.get("/get-session/:toolName", async (req, res) => {
  const toolName = req.params.toolName;
  const tool = toolsConfig[toolName];

  if (!tool) {
    return res.status(404).json({
      success: false,
      error: "الأداة غير موجودة في التكوين"
    });
  }

  try {
    const session = await Session.findOne({ 
      name: tool.sessionCookieName 
    }).sort({ _id: -1 });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "لا توجد جلسة مخزنة للأداة " + toolName
      });
    }

    res.json({
      success: true,
      token: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "حدث خطأ أثناء استرجاع الجلسة للأداة " + toolName
    });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
