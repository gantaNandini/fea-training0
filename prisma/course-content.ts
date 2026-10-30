/**
 * Full course write-ups used by the seed. Every published course gets: an overview, a "what you will
 * learn" list, who it is for, prerequisites, a topic-by-topic outline, and what is included.
 * Nothing here promises a feature the platform does not have (no certificate claims, no live Q&A).
 * The client should review the technical wording before launch.
 */
export interface CourseContent {
  short: string
  overview: string[]
  outcomes: string[]
  audience: string[]
  requirements: string[]
  outline: string[]
}

const ANSYS = 'Access to ANSYS Mechanical (a student or trial licence is fine)'
const SOM = 'Basic knowledge of strength of materials'

export const CONTENT: Record<string, CourseContent> = {
  'full-course-pressure-vessel-design-dba': {
    short:
      'The complete Design-by-Analysis programme for ASME Section VIII Division 2 Part 5: from code philosophy to full 3D FEA assessments of real pressure vessels in ANSYS.',
    overview: [
      'This is the most complete course in the catalogue. It walks you through every failure mode that ASME Section VIII Division 2 Part 5 asks you to check and shows, in ANSYS, how to model, solve and document each one.',
      'You will start with the logic of the code and the material models it expects, then work through elastic stress analysis, plastic collapse, local failure, buckling, fatigue and ratcheting using complete worked examples rather than isolated theory.',
      'By the end you will be able to plan a design-by-analysis assessment, choose the right method for each failure mode, run it in ANSYS and write up the results in a form a reviewer can follow.',
    ],
    outcomes: [
      'Explain the structure of Part 5 and choose the right assessment route for each failure mode',
      'Apply the elastic stress analysis method with correct stress classification and linearisation',
      'Run limit-load and elastic-plastic collapse analyses and interpret the results against the code',
      'Check local failure and buckling using the methods the code permits',
      'Carry out fatigue and ratcheting assessments of vessel components',
      'Build clean, defensible ANSYS models and document them for review',
    ],
    audience: [
      'Pressure vessel design and stress engineers who need to move from design-by-rule to design-by-analysis',
      'Analysts in fabrication, EPC and consultancy firms producing code calculations',
      'Reviewers and inspectors who need to understand what a good analysis report contains',
    ],
    requirements: [SOM, 'Familiarity with ASME Section VIII Division 1 is helpful but not essential', ANSYS],
    outline: [
      'Code overview and the philosophy of design by analysis',
      'Material models and allowable stresses',
      'Elastic stress analysis and stress classification',
      'Protection against plastic collapse',
      'Protection against local failure',
      'Protection against buckling',
      'Protection against failure from cyclic loading: fatigue and ratcheting',
      'Complete worked examples in ANSYS',
    ],
  },
  'fatigue-ratchetting-creep-assessment': {
    short:
      'Fatigue, ratcheting and creep assessment of pressure vessels per ASME VIII Div 2 Part 5, with a complete 3D vertical vessel example in ANSYS.',
    overview: [
      'Cyclic loading is where many vessels fail in service. This course focuses on the cyclic and time-dependent checks in Part 5 and shows how to carry each one out in ANSYS.',
      'You will begin with the fundamentals of fatigue calculation, move through the Level 1 screening methods, and then perform a Level 2 fatigue analysis and a ratcheting assessment on a 3D vertical pressure vessel model.',
      'The course closes with fatigue material data and protection against creep damage, so you know where the inputs come from and what limits apply.',
    ],
    outcomes: [
      'Decide when a vessel needs a fatigue assessment and which screening level applies',
      'Apply the Level 1 screening methods correctly',
      'Carry out a Level 2 fatigue analysis from FEA results',
      'Assess ratcheting using elastic and elastic-plastic approaches',
      'Select and use fatigue material data and design curves',
      'Understand the basis of protection against creep damage',
    ],
    audience: [
      'Stress engineers assessing vessels under pressure and thermal cycling',
      'Engineers who already know basic Div 2 and want to master Part 5.5 and 5.6',
    ],
    requirements: [SOM, 'Some experience with ANSYS Mechanical or the Basic FEA course', ANSYS],
    outline: [
      'Introduction to fatigue calculations',
      '5.5 Level 1 screening methods',
      '3D FEA of a vertical pressure vessel',
      '5.5.4 Level 2 fatigue analysis',
      '5.5.5 Ratcheting assessment',
      'Fatigue material data',
      '5.6 Protection against creep damage',
    ],
  },
  '3d-fracture-mechanics-simulation': {
    short:
      'Model cracks in 3D with ANSYS Mechanical: meshing, stress intensity factors, J-integral and fatigue crack growth, step by step.',
    overview: [
      'Fracture mechanics lets you answer a question stress analysis cannot: is this crack safe? This course teaches how to represent real 3D cracks in ANSYS Mechanical and extract the fracture parameters that engineering assessments rely on.',
      'You will learn the fundamentals, how to build a crack mesh that gives trustworthy results, how to extract stress intensity factors and the J-integral, and how to predict fatigue crack growth.',
    ],
    outcomes: [
      'Explain the fracture parameters (K, J) and when each one applies',
      'Create and mesh 3D cracks in ANSYS Mechanical',
      'Extract stress intensity factors along a crack front',
      'Compute the J-integral and check path independence',
      'Predict fatigue crack growth and remaining life',
      'Validate results against known solutions',
    ],
    audience: [
      'Engineers doing fitness-for-service and integrity assessments',
      'Researchers and analysts who need crack-tip results from FEA',
    ],
    requirements: [SOM, 'Working familiarity with ANSYS Mechanical', ANSYS],
    outline: [
      'Fracture mechanics fundamentals',
      'Crack meshing in ANSYS',
      'Stress intensity factor extraction',
      'J-integral',
      'Fatigue crack growth',
    ],
  },
  'protection-against-local-failure': {
    short:
      'A focused course on ASME VIII Div 2 Part 5.3: check local failure with the elastic and elastic-plastic methods in ANSYS.',
    overview: [
      'Local failure is the check that ensures a vessel does not rupture where strains concentrate. This short, targeted course explains the criterion and walks through both permitted methods.',
      'It is designed so you can take it on its own or as a companion to the full Design-by-Analysis programme.',
    ],
    outcomes: [
      'Understand the local failure criterion and what it protects against',
      'Apply the elastic analysis method',
      'Apply the elastic-plastic analysis method',
      'Present the results clearly in a calculation report',
    ],
    audience: ['Pressure vessel analysts who need the Part 5.3 check in a hurry', 'Engineers building up to the full Div 2 course'],
    requirements: [SOM, 'Basic ANSYS Mechanical experience', ANSYS],
    outline: ['Local failure criterion', 'Elastic method', 'Elastic-plastic method', 'Worked example'],
  },
  'protection-against-global-failure': {
    short:
      'ASME VIII Div 2 Part 5.2 explained: demonstrate protection against plastic collapse with elastic stress, limit-load and elastic-plastic analysis.',
    overview: [
      'Plastic collapse is the most basic failure mode a vessel must be protected against. This course covers the three analysis routes in Part 5.2 and shows how to set up and judge each in ANSYS.',
    ],
    outcomes: [
      'Choose between elastic stress, limit-load and elastic-plastic analysis',
      'Classify stresses and compare them with the allowable limits',
      'Set up a limit-load analysis and read the result',
      'Run an elastic-plastic collapse analysis with the correct load factors',
    ],
    audience: ['Stress and design engineers working to ASME Div 2', 'Engineers preparing for the full Design-by-Analysis course'],
    requirements: [SOM, 'Basic ANSYS Mechanical experience', ANSYS],
    outline: ['Elastic stress analysis method', 'Limit-load analysis', 'Elastic-plastic analysis', 'Worked examples'],
  },
  'basic-fea-ahead-of-pressure-vessel-design': {
    short:
      'The finite element foundation every pressure vessel analyst needs: elements, meshing, boundary conditions, linearisation and post-processing, with a pump casing example.',
    overview: [
      'Good design-by-analysis starts with good FEA. This course builds the foundation: how elements behave, how to mesh sensibly, how to apply supports and loads without over-constraining, and how to post-process stresses for code checks.',
      'It uses pressure-vessel-style problems throughout and finishes with a pump casing example, so the skills transfer directly into the Div 2 courses.',
    ],
    outcomes: [
      'Understand how finite elements work and choose appropriate element types',
      'Build meshes that balance accuracy and run time, and check convergence',
      'Apply boundary conditions and loads that represent the real structure',
      'Linearise stresses along a section for code evaluation',
      'Post-process results and sanity-check them by hand',
      'Complete a pump casing analysis from geometry to report',
    ],
    audience: ['Engineers new to FEA who will work on pressure equipment', 'Designers who want to understand what the analyst is doing'],
    requirements: [SOM, 'No prior FEA experience needed', ANSYS],
    outline: [
      'FEA basics',
      'Element types',
      'Meshing',
      'Boundary conditions',
      'Stress linearisation',
      'Post-processing',
      'Pump casing example',
    ],
  },
  'ansys-training-mechanical-vibrations': {
    short:
      'Modal, harmonic response, random vibration and response spectrum analysis in ANSYS Mechanical, with the theory you need to trust the results.',
    overview: [
      'Vibration problems are about frequency as much as stress. This course teaches the four main dynamic analysis types in ANSYS and the physics behind each, so you can pick the right one and interpret what you get.',
      'Each topic follows the same pattern: a short theory refresher, a guided ANSYS model, and a discussion of common pitfalls.',
    ],
    outcomes: [
      'Run modal analysis and interpret natural frequencies and mode shapes',
      'Perform harmonic response analysis and read frequency response curves',
      'Set up random vibration (PSD) analysis and interpret 1-sigma results',
      'Apply response spectrum analysis for seismic and shock loading',
      'Choose damping and boundary conditions sensibly',
    ],
    audience: ['Mechanical engineers dealing with machinery, piping or structures under dynamic loads', 'Analysts moving from static to dynamic FEA'],
    requirements: [SOM, 'Basic knowledge of dynamics and ANSYS Mechanical', ANSYS],
    outline: ['Modal analysis', 'Harmonic response', 'Random vibration', 'Response spectrum'],
  },
  'basic-fea-training-for-beginners': {
    short:
      'Start your finite element journey: what FEA is, how to run your first static analysis, mesh well and read results with confidence.',
    overview: [
      'A gentle, practical introduction for engineers who have never run an FEA model. You will learn what the software is really doing, then build and solve a first static analysis end to end.',
      'The course emphasises habits that prevent wrong answers: checking units, checking reactions, refining the mesh and comparing against hand calculations.',
    ],
    outcomes: [
      'Explain in plain terms what FEA does and its limits',
      'Build and solve a first static structural analysis in ANSYS',
      'Mesh a part sensibly and run a basic convergence check',
      'Read stress, deformation and reaction results correctly',
    ],
    audience: ['Graduate and early-career engineers', 'Designers who want to run simple checks themselves'],
    requirements: ['Basic knowledge of mechanics', 'No prior FEA experience needed', ANSYS],
    outline: ['What is FEA', 'First static analysis', 'Meshing basics', 'Reading results'],
  },
  'rotordynamics-analysis': {
    short:
      'Lateral and torsional rotor dynamics: rotor models, bearings, Campbell diagrams, unbalance response and torsional analysis using ANSYS.',
    overview: [
      'Rotating machinery needs its own kind of dynamic analysis. This course covers the fundamentals and then applies them to realistic rotor-bearing systems.',
      'You will build rotor models, include bearing stiffness and damping, calculate critical speeds with Campbell diagrams, predict unbalance response and carry out torsional analysis.',
    ],
    outcomes: [
      'Build a rotor model with discs, shafts and supports',
      'Represent bearings with stiffness and damping coefficients',
      'Generate and read a Campbell diagram to find critical speeds',
      'Predict unbalance response and compare it with acceptance limits',
      'Perform torsional natural frequency and response analysis',
    ],
    audience: ['Rotating equipment and turbomachinery engineers', 'Analysts supporting compressors, pumps, turbines and motors'],
    requirements: [SOM, 'Basic vibrations knowledge', ANSYS],
    outline: ['Rotor fundamentals', 'Bearings', 'Campbell diagram', 'Unbalance response', 'Torsional analysis'],
  },
  'advanced-fea-ansys-workbench-apdl': {
    short:
      'Go beyond the GUI: APDL scripting, contact modelling, submodelling and automation for advanced ANSYS Workbench workflows.',
    overview: [
      'This advanced course is for analysts who already work comfortably in Workbench and want more control. You will learn APDL, use it inside Workbench, and automate repetitive work.',
      'Contact modelling and submodelling receive particular attention because they decide the quality of many industrial analyses.',
    ],
    outcomes: [
      'Write and debug APDL scripts and use them inside Workbench',
      'Model contact correctly and diagnose convergence trouble',
      'Use submodelling to resolve local detail without remeshing the whole model',
      'Automate parametric studies and post-processing',
    ],
    audience: ['Experienced FEA users', 'Analysts who want repeatable, scripted workflows'],
    requirements: ['Working experience of ANSYS Workbench', 'Completion of a basic FEA course or equivalent', ANSYS],
    outline: ['APDL basics', 'Contact modelling', 'Submodelling', 'Automation'],
  },
  'ansys-training-fatigue-and-fracture-mechanics': {
    short:
      'Stress-life, strain-life and crack growth in ANSYS: predict fatigue life and understand when a crack becomes critical.',
    overview: [
      'This course connects classical fatigue with fracture mechanics. You will estimate crack initiation life with stress-life and strain-life methods and then predict how a crack grows.',
    ],
    outcomes: [
      'Choose between stress-life and strain-life approaches',
      'Run fatigue analyses in ANSYS with realistic load histories',
      'Account for mean stress, surface finish and other correction factors',
      'Predict crack growth with a Paris-type law',
    ],
    audience: ['Design and durability engineers', 'Analysts assessing components under cyclic load'],
    requirements: [SOM, 'Basic ANSYS Mechanical experience', ANSYS],
    outline: ['Stress-life', 'Strain-life', 'Crack growth'],
  },
  'ansys-training-non-linear-analysis': {
    short:
      'Material, geometric and contact nonlinearity in ANSYS, plus the practical skills to make nonlinear models converge.',
    overview: [
      'Real structures yield, deform a lot and touch each other. This course explains the three sources of nonlinearity and how ANSYS solves them.',
      'A substantial part of the course is about convergence: reading the solver output, spotting what is going wrong and fixing it.',
    ],
    outcomes: [
      'Define plasticity and hyperelastic-style material behaviour',
      'Handle large deflections and stability correctly',
      'Set up contact with appropriate formulations and stiffness',
      'Diagnose and fix convergence problems',
    ],
    audience: ['Analysts moving from linear to nonlinear FEA', 'Engineers whose models fail to converge'],
    requirements: [SOM, 'Basic ANSYS Mechanical experience', ANSYS],
    outline: ['Material nonlinearity', 'Geometric nonlinearity', 'Contact', 'Convergence'],
  },
  'offshore-wind-turbine-structures-welded-joint-fatigue-dnv': {
    short:
      'Coming soon: welded joint and fatigue assessment of offshore wind turbine support structures following DNV guidance.',
    overview: [
      'This programme is in preparation. It will cover fatigue assessment of welded joints in offshore wind turbine support structures using DNV guidance. Lessons will be published here when the course opens.',
    ],
    outcomes: [
      'Understand fatigue loading on offshore wind support structures',
      'Apply S-N curve based fatigue assessment to welded joints',
      'Use hot-spot and notch stress methods with FEA',
    ],
    audience: ['Structural engineers working on offshore wind foundations and towers'],
    requirements: [SOM, 'Basic fatigue knowledge', ANSYS],
    outline: ['Details will be announced when the course opens'],
  },
}

const li = (items: string[]) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`

export function buildDescription(
  slug: string,
  meta: { lessons: number; hours: number; upcoming: boolean },
): { description: string; short: string; outcomes: string[]; requirements: string[] } | null {
  const c = CONTENT[slug]
  if (!c) return null
  const duration = meta.hours > 0 ? `about ${meta.hours % 1 === 0 ? meta.hours : meta.hours.toFixed(1)} hours of video` : null
  const included = meta.upcoming
    ? ['Lifetime access once the course opens', 'Learn on any device']
    : [
        `${meta.lessons} lessons${duration ? `, ${duration}` : ''}`,
        'Full lifetime access, watch at your own pace',
        'Instant access the moment your payment succeeds',
        'Learn on any device',
      ]
  const html =
    `<h3>Overview</h3>${c.overview.map((p) => `<p>${p}</p>`).join('')}` +
    `<h3>What you will learn</h3>${li(c.outcomes)}` +
    `<h3>Course outline</h3>${li(c.outline)}` +
    `<h3>Who this course is for</h3>${li(c.audience)}` +
    `<h3>Requirements</h3>${li(c.requirements)}` +
    `<h3>What is included</h3>${li(included)}`
  return { description: html, short: c.short, outcomes: c.outcomes, requirements: c.requirements }
}
