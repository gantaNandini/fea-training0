/** Long-form text for the home-page "Fatigue Analysis for Pressure Vessels" programme (from the client's live site). */
const mod = (title: string, items: (string | string[])[]) =>
  `<h3>${title}</h3><ul>${items
    .map((i) => (Array.isArray(i) ? `<ul>${i.map((x) => `<li>${x}</li>`).join('')}</ul>` : `<li>${i}</li>`))
    .join('')}</ul>`

export const PROGRAMME_TITLE = 'Fatigue Analysis for Pressure Vessels'

export const PROGRAMME_BODY =
  `<h2>ASME Section VIII Division 2 – Part 5</h2>` +
  `<p>This specialized training program provides a complete, code-compliant methodology for fatigue assessment of pressure vessels based on ASME Section VIII Division 2, Part 5. The course integrates theory, ASME code interpretation, and finite element analysis (FEA) to enable engineers to confidently perform fatigue screening, stress-life, strain-life, ratcheting, and weld fatigue evaluations for real-world pressure equipment.</p>` +
  `<p><strong>24 Sessions | 45 Minutes Each | Practical + Code-Oriented</strong></p>` +
  `<h2>Course Objectives</h2><p>By the end of this course, participants will be able to:</p><ul>` +
  [
    'Understand fatigue damage mechanisms in pressure vessels',
    'Apply ASME Div 2 Part 5 fatigue rules correctly',
    'Perform fatigue screening as per ASME 5.5.3',
    'Extract and process FEA stresses for fatigue assessment',
    'Conduct stress-life and strain-life fatigue evaluations',
    'Assess ratcheting, shakedown, and weld fatigue',
    'Execute an end-to-end fatigue assessment workflow',
  ]
    .map((x) => `<li>${x}</li>`)
    .join('') +
  `</ul><h2>Detailed Course Modules</h2>` +
  mod('MODULE 1 – Fatigue &amp; Failure Fundamentals', [
    'Overview of pressure vessel failure modes',
    'Fatigue cracking vs plastic collapse vs buckling',
    'Cyclic loading sources in pressure vessels',
    'Fatigue damage accumulation concepts',
    'Difference between strength-based design (Part 4) and fatigue-based design (Part 5)',
  ]) +
  mod('MODULE 2 – Stress Generation &amp; FEA Foundations', [
    'Types of stresses relevant to fatigue (primary, secondary, peak)',
    'Stress categorization for fatigue assessment',
    'Linear elastic FEA assumptions and limitations',
    'Mesh requirements and convergence for fatigue analysis',
    'Stress linearization through thickness',
    'Identification of fatigue hot spots',
  ]) +
  mod('MODULE 3 – Fatigue Screening (ASME Part 5.5.3)', [
    'Purpose and philosophy of fatigue screening',
    'Applicability limits and conservative assumptions',
    'Screening Method A – Material and load-cycle based screening',
    'Screening Method B – Elastic stress range screening',
    'Screening Method C – Welded joint screening',
    'Decision flow for detailed fatigue analysis',
  ]) +
  mod('MODULE 4 – Stress–Life (S–N) Fatigue Analysis', [
    'Stress-life fatigue theory fundamentals',
    'High-cycle vs low-cycle fatigue behavior',
    'ASME fatigue design curves',
    'Mean stress effects and correction models',
    ['Goodman method', 'Gerber method'],
    'Rainflow cycle counting technique',
    'Constant amplitude fatigue damage calculation',
    'Variable amplitude fatigue damage using Miner’s Rule',
  ]) +
  mod('MODULE 5 – Strain-Based &amp; Elastic–Plastic Fatigue', [
    'Onset of plasticity and local strain concentration',
    'Limitations of purely elastic fatigue analysis',
    'Strain-life (ε–N) approach fundamentals',
    'Coffin–Manson and Basquin relationships',
    'Mean stress effects in strain-life fatigue',
    ['Morrow model', 'Smith–Watson–Topper (SWT) parameter'],
    'Local strain estimation using Neuber’s Rule',
  ]) +
  mod('MODULE 6 – Ratcheting and Shakedown', [
    'Ratcheting behavior under cyclic pressure and thermal loads',
    'ASME ratcheting acceptance criteria',
    'Elastic and elastic-plastic ratcheting assessments',
    'Shakedown concepts and cyclic stabilization',
    'Relationship between ratcheting, shakedown, and fatigue life',
  ]) +
  mod('MODULE 7 – Weld Fatigue and Structural Stress', [
    'Fatigue behavior of welded joints',
    'Stress concentration and crack initiation at weld toes',
    'ASME weld fatigue evaluation approaches',
    'Equivalent Structural Stress Method (ASME Method C)',
    'Fatigue acceptance criteria for welded joints',
    'Role of inspection, pressure testing, and life management',
  ]) +
  mod('MODULE 8 – Integration, Workflow &amp; Case Studies', [
    'End-to-end fatigue assessment workflow',
    'Load definition → FEA → stress extraction → fatigue evaluation',
    'Typical mistakes and best practices',
    'Case studies on pressure vessels and nozzles',
    'Documentation and reporting as per ASME requirements',
  ])

export const ABOUT_BODY =
  '<p>PYTHAGORAS Engineering and Consultancy offers high-quality instruction in the field of finite element analysis with the Ansys software. This course is designed using real-time examples to understand CAE/CFD/CAD tools easily and efficiently. A significant number of individuals hailing from various regions throughout the globe have derived advantages from the meticulously designed instructional program.</p>' +
  '<p>M/s. Pythagoras Engineering Consultancy and Services Pvt. Limited, #134 &amp; 135, Karthik Nagar, LRDE Layout, Doddanekundi Post, Bangalore – 560037.</p>'
