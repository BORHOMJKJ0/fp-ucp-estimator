const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

const app = express()
app.use(cors())
app.use(express.json())

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const FONT_PATH = path.join(__dirname, 'fonts', 'NotoNaskhArabic-Regular.ttf')
const DEFAULT_FONT = fs.existsSync(FONT_PATH) ? FONT_PATH : 'Helvetica'

// ─── FP Calculation ───────────────────────────────────────────────────────────
function calculateFP (fpData) {
  const weights = {
    inputs: { simple: 3, average: 4, complex: 6 },
    outputs: { simple: 4, average: 5, complex: 7 },
    queries: { simple: 3, average: 4, complex: 6 },
    internalFiles: { simple: 7, average: 10, complex: 15 },
    externalFiles: { simple: 5, average: 7, complex: 10 }
  }

  let ufc = 0
  for (const [type, levels] of Object.entries(weights)) {
    for (const [level, weight] of Object.entries(levels)) {
      ufc += (fpData[type]?.[level] || 0) * weight
    }
  }

  // VAF = 0.65 + 0.01 * sum of 14 GSCs (each 0-5)
  const gscSum = (fpData.gsc || []).reduce((a, b) => a + b, 0)
  const vaf = 0.65 + 0.01 * gscSum
  const fp = ufc * vaf

  // Industry average: 10 hours/FP, $75/hour
  const effortHours = fp * 10
  const cost = effortHours * 75

  return { ufc, vaf, fp, gscSum, effortHours, cost }
}

// ─── UCP Calculation ──────────────────────────────────────────────────────────
function calculateUCP (ucpData) {
  const actorWeights = { simple: 1, average: 2, complex: 3 }
  const useCaseWeights = { simple: 5, average: 10, complex: 15 }

  let uaw = 0
  for (const [level, weight] of Object.entries(actorWeights)) {
    uaw += (ucpData.actors?.[level] || 0) * weight
  }

  let uucw = 0
  for (const [level, weight] of Object.entries(useCaseWeights)) {
    uucw += (ucpData.useCases?.[level] || 0) * weight
  }

  const uucp = uaw + uucw

  // TCF: 13 factors, each 0-5
  const tcfSum = (ucpData.tcf || []).reduce((a, b) => a + b, 0)
  const tcf = 0.6 + 0.01 * tcfSum

  // ECF: 8 factors, each 0-5
  const ecfSum = (ucpData.ecf || []).reduce((a, b) => a + b, 0)
  const ecf = 1.4 + -0.03 * ecfSum

  const ucp = uucp * tcf * ecf

  // Industry average: 20 hours/UCP, $75/hour
  const effortHours = ucp * 20
  const cost = effortHours * 75

  return { uaw, uucw, uucp, tcf, ecf, ucp, effortHours, cost }
}

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `أنت مساعد ذكي متخصص في تقدير حجم وجهد وتكلفة المشاريع البرمجية باستخدام طريقتي Function Point (FP) و Use Case Point (UCP).

مهمتك: إجراء حوار منظم مع المستخدم لجمع جميع المعلومات اللازمة، ثم حساب التقديرات.

## مراحل الحوار:

### المرحلة 1: فهم المشروع
- اطلب وصفاً عاماً للمشروع
- اسأل عن نوع النظام (ويب، موبايل، سطح مكتب، API)

### المرحلة 2: جمع بيانات Function Point
اسأل بشكل منظم عن:
1. **المدخلات (Inputs)**: عدد شاشات/نماذج الإدخال - صنّفها: بسيطة/متوسطة/معقدة
2. **المخرجات (Outputs)**: تقارير، رسائل، مستندات - بسيطة/متوسطة/معقدة
3. **الاستعلامات (Queries)**: عمليات البحث والاستعلام - بسيطة/متوسطة/معقدة
4. **الملفات الداخلية (ILF)**: قواعد البيانات والملفات الداخلية - بسيطة/متوسطة/معقدة
5. **الملفات الخارجية (EIF)**: بيانات من أنظمة خارجية - بسيطة/متوسطة/معقدة
6. **عوامل التعقيد العامة (GSC)**: 14 عامل، اسأل عن تقييم كل منها من 0-5:
   - الاتصالات، معالجة البيانات الموزعة، الأداء، الاستخدام الشديد للمعالج
   - معدل المعاملات، الإدخال التفاعلي، الكفاءة، التحديثات الأونلاين
   - معالجة المدخلات المعقدة، قابلية إعادة الاستخدام، سهولة التثبيت
   - سهولة التشغيل، مواقع متعددة، التسهيل للتغيير

### المرحلة 3: جمع بيانات Use Case Point
اسأل عن:
1. **الممثلون (Actors)**:
   - بسيط (API/نظام آخر): عددهم
   - متوسط (واجهة مستخدم بسيطة): عددهم
   - معقد (مستخدم يتفاعل بـ GUI كامل): عددهم
2. **حالات الاستخدام (Use Cases)**:
   - بسيطة (≤3 معاملات): عددها
   - متوسطة (4-7 معاملات): عددها
   - معقدة (>7 معاملات): عددها
3. **عوامل التعقيد التقني (TCF)**: 13 عامل، كل منها 0-5:
   نظام موزع، أداء استجابة، كفاءة للمستخدم النهائي، معالجة داخلية معقدة
   قابلية إعادة الاستخدام، سهولة التثبيت، سهولة الاستخدام، قابلية التنقل
   سهولة التغيير، التزامنية، ميزات الأمان، الوصول لأطراف ثالثة، متطلبات التدريب
4. **عوامل البيئة (ECF)**: 8 عوامل، كل منها 0-5:
   إلمام بـ UML، خبرة في التطبيق، خبرة OO، محلل رئيسي، تحفيز، متطلبات مستقرة، عمال جزئيون، لغة برمجة صعبة

## تعليمات مهمة:
- اطرح الأسئلة بالعربية بشكل واضح وودي
- قدم أمثلة لمساعدة المستخدم على الفهم
- بعد جمع كل البيانات، أرسل JSON منظماً في نهاية ردك بالشكل التالي (ضمن كود بلوك json):

\`\`\`json
{
  "stage": "complete",
  "projectInfo": {
    "name": "اسم المشروع",
    "description": "وصف المشروع",
    "type": "نوع النظام"
  },
  "fpData": {
    "inputs": {"simple": 0, "average": 0, "complex": 0},
    "outputs": {"simple": 0, "average": 0, "complex": 0},
    "queries": {"simple": 0, "average": 0, "complex": 0},
    "internalFiles": {"simple": 0, "average": 0, "complex": 0},
    "externalFiles": {"simple": 0, "average": 0, "complex": 0},
    "gsc": [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  },
  "ucpData": {
    "actors": {"simple": 0, "average": 0, "complex": 0},
    "useCases": {"simple": 0, "average": 0, "complex": 0},
    "tcf": [0,0,0,0,0,0,0,0,0,0,0,0,0],
    "ecf": [0,0,0,0,0,0,0,0]
  }
}
\`\`\`

إذا لم تكتمل البيانات بعد، لا ترسل JSON واستمر في طرح الأسئلة.`

// ─── Chat Endpoint ─────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, apiKey } = req.body
  const cleanKey = String(apiKey || '').trim()

  if (!cleanKey) return res.status(400).json({ error: 'API key required' })

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7
      })
    })

    const data = await response.json()
    if (!response.ok) {
      let apiError = data.error?.message || data.error || 'API Error'
      if (response.status === 401 || response.status === 403) {
        apiError =
          'Invalid or expired API key. يرجى التحقق من مفتاح OpenRouter الخاص بك.'
      } else if (response.status === 429) {
        apiError =
          'تم تجاوز الحد المسموح به أو هناك طلبات كثيرة. حاول مجدداً بعد دقائق.'
      }
      return res.status(response.status).json({ error: apiError })
    }

    if (!data?.choices?.[0]?.message?.content) {
      return res.status(502).json({
        error:
          'استجابة OpenRouter غير صالحة. حاول إعادة الإرسال أو تحقق من حالة الخدمة.'
      })
    }

    const content = data.choices[0].message.content

    // Try to extract JSON from response
    let extractedData = null
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      try {
        extractedData = JSON.parse(jsonMatch[1])
        if (extractedData.stage === 'complete') {
          const fpResults = calculateFP(extractedData.fpData)
          const ucpResults = calculateUCP(extractedData.ucpData)
          extractedData.fpResults = fpResults
          extractedData.ucpResults = ucpResults
        }
      } catch (e) {
        extractedData = null
      }
    }

    res.json({ content, extractedData })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PDF Generation Endpoint ──────────────────────────────────────────────────
app.post('/api/generate-pdf', (req, res) => {
  const { projectData } = req.body
  const { projectInfo, fpData, ucpData, fpResults, ucpResults } = projectData

  const doc = new PDFDocument({ margin: 50, size: 'A4' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="estimation-report.pdf"`
  )
  doc.pipe(res)
  doc.font(DEFAULT_FONT)

  const drawLine = () => {
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#3b82f6')
      .lineWidth(1)
      .stroke()
    doc.moveDown(0.5)
  }

  const section = title => {
    doc.moveDown(0.5)
    doc.rect(50, doc.y, 495, 25).fill('#1e3a5f')
    doc
      .fillColor('white')
      .fontSize(13)
      .text(title, 55, doc.y + 5, { align: 'left', width: 485 })
    doc.fillColor('#1a1a2e').moveDown(1.5)
  }

  const safeValue = value =>
    value === undefined || value === null || value === '' ? 'N/A' : value

  const row = (label, value, colored = false) => {
    const text = `${label} ${value}`
    if (colored) {
      const startY = doc.y
      doc.rect(50, startY, 495, 22).fill('#f0f6ff')
      doc.fillColor('#1a1a2e')
      doc.text(text, 55, startY + 5, { width: 485 })
    } else {
      doc.fillColor('#1a1a2e').text(text, 55, { width: 485 })
    }
    doc.moveDown(0.8)
  }

  // ── Cover ──
  doc.rect(0, 0, 595, 150).fill('#1e3a5f')
  doc
    .fillColor('white')
    .fontSize(24)
    .text('Software Project Estimation Report', 50, 40, {
      align: 'center',
      width: 495
    })
  doc.fontSize(13).text('Function Point & Use Case Point Analysis', 50, 80, {
    align: 'center',
    width: 495
  })
  doc.fontSize(10).text(
    `Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`,
    50,
    110,
    { align: 'center', width: 495 }
  )
  doc.fillColor('#1a1a2e').moveDown(4)

  // ── Project Info ──
  section('PROJECT INFORMATION')
  row('Project Name:', safeValue(projectInfo.name), true)
  row('System Type:', safeValue(projectInfo.type))
  row('Description:', safeValue(projectInfo.description), true)
  drawLine()

  // ── FP Data ──
  section('FUNCTION POINT — INPUT DATA')
  const fpItems = [
    ['External Inputs (EI)', fpData.inputs],
    ['External Outputs (EO)', fpData.outputs],
    ['External Queries (EQ)', fpData.queries],
    ['Internal Logical Files (ILF)', fpData.internalFiles],
    ['External Interface Files (EIF)', fpData.externalFiles]
  ]
  fpItems.forEach(([label, data], i) => {
    row(
      `${label}  Simple/Average/Complex:`,
      `${data.simple} / ${data.average} / ${data.complex}`,
      i % 2 === 0
    )
  })
  row(
    'GSC Total (14 factors):',
    fpData.gsc.reduce((a, b) => a + b, 0),
    true
  )
  drawLine()

  // ── FP Results ──
  section('FUNCTION POINT — RESULTS')
  row('Unadjusted Function Count (UFC):', fpResults.ufc.toFixed(2), true)
  row('Value Adjustment Factor (VAF):', fpResults.vaf.toFixed(4))
  row('Function Points (FP):', fpResults.fp.toFixed(2), true)
  row('Estimated Effort:', `${fpResults.effortHours.toFixed(0)} hours`)
  row(
    'Estimated Cost:',
    `$${fpResults.cost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    true
  )
  drawLine()

  // ── UCP Data ──
  section('USE CASE POINT — INPUT DATA')
  row(
    'Actors  Simple/Average/Complex:',
    `${ucpData.actors.simple} / ${ucpData.actors.average} / ${ucpData.actors.complex}`,
    true
  )
  row(
    'Use Cases  Simple/Average/Complex:',
    `${ucpData.useCases.simple} / ${ucpData.useCases.average} / ${ucpData.useCases.complex}`
  )
  row(
    'TCF Factors Sum:',
    ucpData.tcf.reduce((a, b) => a + b, 0),
    true
  )
  row(
    'ECF Factors Sum:',
    ucpData.ecf.reduce((a, b) => a + b, 0)
  )
  drawLine()

  // ── UCP Results ──
  section('USE CASE POINT — RESULTS')
  row('Unadjusted Actor Weight (UAW):', ucpResults.uaw.toFixed(2), true)
  row('Unadjusted Use Case Weight (UUCW):', ucpResults.uucw.toFixed(2))
  row('Unadjusted UCP (UUCP):', ucpResults.uucp.toFixed(2), true)
  row('Technical Complexity Factor (TCF):', ucpResults.tcf.toFixed(4))
  row('Environmental Complexity Factor (ECF):', ucpResults.ecf.toFixed(4), true)
  row('Use Case Points (UCP):', ucpResults.ucp.toFixed(2))
  row('Estimated Effort:', `${ucpResults.effortHours.toFixed(0)} hours`, true)
  row(
    'Estimated Cost:',
    `$${ucpResults.cost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  )
  drawLine()

  // ── Summary ──
  section('FINAL SUMMARY')
  const avgHours = (
    (fpResults.effortHours + ucpResults.effortHours) /
    2
  ).toFixed(0)
  const avgCost = ((fpResults.cost + ucpResults.cost) / 2)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  row('FP Effort Estimate:', `${fpResults.effortHours.toFixed(0)} hours`, true)
  row('UCP Effort Estimate:', `${ucpResults.effortHours.toFixed(0)} hours`)
  row('Average Effort Estimate:', `${avgHours} hours`, true)
  row('Average Cost Estimate:', `$${avgCost}`)

  doc.moveDown(1)
  doc.rect(50, doc.y, 495, 60).fill('#f0f9ff').stroke('#3b82f6')
  doc
    .fillColor('#1e3a5f')
    .fontSize(11)
    .text('Assumptions:', 60, doc.y - 50)
  doc
    .fontSize(9)
    .fillColor('#374151')
    .text(
      '• FP: 10 hours/FP at $75/hour  |  UCP: 20 hours/UCP at $75/hour',
      60,
      doc.y - 5
    )
    .text(
      '• Estimates are approximations. Actual values may vary based on team expertise and project specifics.',
      60,
      doc.y + 5
    )

  doc.end()
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
