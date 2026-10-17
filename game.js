/* Embodied Quest: a playable résumé for Haodong Zou. Everything on the canvas is drawn in code. */
(() => {
'use strict';

// ===================== constants & utils =====================
const H = 216, GY = 176, WORLD_W = 6900, GAP0 = 4460, GAP1 = 4660; // GAP0..GAP1 is the sea between Beijing and Singapore
let VW = 384, SCALE = 3;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, k) => a + (b - a) * k;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').imageSmoothingEnabled = false; return c; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function mix(a, b, k) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(lerp(A[2], B[2], k))})`; }
function stopsAt(st, k) { const n = st.length - 1; const i = Math.min(n - 1, Math.floor(k * n)); return mix(st[i], st[i + 1], clamp(k * n - i, 0, 1)); }
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
  raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  setRaw(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } },
};
const TOP_LEVEL = (() => { try { return window.top === window.self; } catch (e) { return false; } })();

// ===================== palette =====================
const C = {
  ink: '#14121d', night: '#1f2340', navy: '#2b3a67', blue: '#3f6fb5', sky: '#8fc3e8', pale: '#d6ecf5',
  cyan: '#4fd6e0', teal: '#2a8a8a', gDark: '#2f6b3a', green: '#4fa34a', lime: '#9bd35a',
  gold: '#f2c84b', goldD: '#c99a2e', orange: '#e88a3a', rust: '#b5512f', red: '#d6443c',
  mag: '#e0457b', pink: '#f49ac1', skin: '#f2c9a5', skinD: '#d9a07e', hair: '#1b1820', hairH: '#3d3852',
  white: '#eef1f6', lgray: '#c4c9d4', gray: '#8b90a0', dgray: '#4d5263', vdgray: '#2b2e3a',
  brown: '#7a4f35', wood: '#9a6a3f', tan: '#c09060', tee: '#24222c', teeD: '#18161e', denim: '#34405e', denimD: '#262f47',
  nusO: '#ef7c00', nusB: '#003d7c', ok: '#7fdc6a',
};

// ===================== 5x7 bitmap font =====================
const GL = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [28, 18, 17, 17, 17, 18, 28],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 17, 10, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14],
  4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8],
  8: [14, 17, 17, 14, 17, 17, 14], 9: [14, 17, 17, 15, 1, 2, 12],
  '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8], ':': [0, 12, 12, 0, 12, 12, 0], '-': [0, 0, 0, 14, 0, 0, 0],
  '+': [0, 4, 4, 31, 4, 4, 0], '/': [1, 1, 2, 4, 8, 16, 16], '%': [24, 25, 2, 4, 8, 19, 3], '&': [12, 18, 20, 8, 21, 18, 13],
  '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4], '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8],
  "'": [12, 4, 8, 0, 0, 0, 0], '>': [8, 4, 2, 1, 2, 4, 8], '<': [2, 4, 8, 16, 8, 4, 2], '→': [0, 4, 2, 31, 2, 4, 0],
  '#': [10, 10, 31, 10, 31, 10, 10], '=': [0, 0, 31, 0, 31, 0, 0], '*': [0, 4, 21, 14, 21, 4, 0], '_': [0, 0, 0, 0, 0, 0, 31],
  ' ': [0, 0, 0, 0, 0, 0, 0], '·': [0, 0, 0, 4, 0, 0, 0],
};
const TXT = new Map();
function txtImg(s, col) {
  const key = s + '|' + col; let im = TXT.get(key); if (im) return im;
  const u = s.toUpperCase(); im = mk(Math.max(1, u.length * 6 - 1), 7); const g = im.getContext('2d'); g.fillStyle = col;
  for (let i = 0; i < u.length; i++) { const gl = GL[u[i]] || GL['?']; for (let r = 0; r < 7; r++) for (let b = 0; b < 5; b++) if ((gl[r] >> (4 - b)) & 1) g.fillRect(i * 6 + b, r, 1, 1); }
  TXT.set(key, im); return im;
}

// ===================== résumé content (from cv_revised.tex / cv_zh.tex) =====================
const EMAIL = 'zouhaodong@u.nus.edu', PHONE = '(+86) 137 1775 4860', PHONE_TEL = '+8613717754860';
const CV_FILES = { zh: 'Haodong_Zou_CV_zh.pdf', en: 'Haodong_Zou_CV_en.pdf' }, SITE_HOME = '';
const SEC = {
  profile: { zh: '档案', en: 'Profile' }, edu: { zh: '教育', en: 'Education' }, exp: { zh: '经历', en: 'Experience' },
  honor: { zh: '荣誉', en: 'Honors' }, skill: { zh: '技能', en: 'Skills' }, side: { zh: '支线任务', en: 'Side quests' },
  act: { zh: '活动', en: 'Activities' }, contact: { zh: '联系', en: 'Contact' },
};
const ENTRY = {
  intro: { sec: 'profile',
    zh: { t: '邹浩东 · 研究兴趣', s: '具身智能 · 机器人学习 · 灵巧操作 · Sim-to-Real', m: '现居新加坡',
      b: ['面向人形机器人行走与移动操作、全身动作跟踪及双臂灵巧操作，探索从人类视频和第一视角示范中学习可迁移的运动与操作技能。',
        '关注动作重定向、强化学习与模仿学习，以及技能在复杂地形和物体交互中的泛化与 sim-to-real 迁移。'],
      h: '一路向右走，就是这份简历的时间线。点鼠标朝鼠标方向射击（J 键自动瞄准），E 互动。项目变成了小怪：捡起对应的算法或工具（发光的卡带）打败它们，会掉出项目宝石和技能宝石。' },
    en: { t: 'Haodong Zou · Research Interests', s: 'Embodied AI · Robot Learning · Dexterous Manipulation · Sim-to-Real', m: 'Based in Singapore',
      b: ['Learning transferable skills for humanoid locomotion, whole-body motion tracking, loco-manipulation, and dual-arm dexterous manipulation from human videos and egocentric demonstrations.',
        'Focused on motion retargeting, reinforcement and imitation learning, generalization across terrains and object interactions, and sim-to-real transfer.'],
      h: 'Walk right through the timeline. Click to shoot toward the mouse (J auto-aims), E interacts. The projects have turned into monsters: grab the matching algorithm or tool (the glowing cartridges) to beat them and collect project and skill gems.' } },
  bit: { sec: 'edu',
    zh: { t: '北京理工大学', s: '自动化 工学学士 · GPA 88.5/100', m: '2022.09 — 2026.07 · 北京',
      b: ['GPA 88.5/100。', '主修课程：控制理论、计算机控制系统、信号处理、嵌入式系统。'], h: '奖杯、宝箱和公告栏可以互动；五个本科项目变成了小怪，打败它们就能拿到项目宝石。' },
    en: { t: 'Beijing Institute of Technology', s: 'B.Eng. in Automation · GPA 88.5/100', m: 'Sep 2022 — Jul 2026 · Beijing',
      b: ['GPA 88.5/100.', 'Selected coursework: Control Theory, Computer-Controlled Systems, Signal Processing, Embedded Systems.'], h: 'The trophies, chest and notice board are interactive. The five undergrad projects are now monsters; beat them for their project gems.' } },
  honor_physics: { sec: 'honor',
    zh: { t: '物理竞赛双奖', m: '2023', b: ['全国大学生物理实验竞赛 省级一等奖', '全国大学生物理学术竞赛 省级三等奖'] },
    en: { t: 'Physics competitions', m: '2023', b: ['Provincial First Prize, Chinese Undergraduate Physics Experiment Competition', 'Provincial Third Prize, China Undergraduate Physics Tournament'] } },
  scholar: { sec: 'honor',
    zh: { t: '奖学金与荣誉称号', m: '北京理工大学', b: ['本科生二等奖学金、三等奖学金', '优秀学生'] },
    en: { t: 'Scholarships', m: 'BIT', b: ['Second-Class and Third-Class Scholarships', 'Outstanding Student Award'] } },
  honor_cup: { sec: 'honor',
    zh: { t: '“世纪杯”竞赛 二等奖', m: '2025 · 北京理工大学', b: ['北京理工大学第二十二届“世纪杯”学生课外学术科技作品竞赛二等奖。'] },
    en: { t: '“Century Cup” Second Prize', m: '2025 · BIT', b: ['Second Prize, 22nd “Century Cup” Student Academic and Technology Competition, BIT.'] } },
  side_maze: { sec: 'side',
    zh: { t: '弹球与平板迷宫', s: '项目负责人', m: '2023.04 — 2023.06', b: ['搭建集成传感器、控制器与执行器的硬件平台，确保各模块协同稳定运行。', '在 Simulink 中实现电机控制与小球速度/位置控制，并编写导航与路径规划功能，完成自主导航。'] },
    en: { t: 'Ball-and-plate maze', s: 'Project lead', m: 'Apr — Jun 2023', b: ['Built a hardware platform integrating sensors, controller and actuators.', 'Implemented motor control and ball velocity/position control in Simulink, plus navigation and path planning, for autonomous navigation.'] } },
  side_map: { sec: 'side',
    zh: { t: '校园地图应用', s: '软件工程师', m: '2024.08 — 2024.11', b: ['负责从需求分析到功能实现的全流程，设计系统架构与界面布局。', '用合适的数据结构与算法实现地图显示、路径规划与位置检索。'] },
    en: { t: 'Campus map app', s: 'Software engineer', m: 'Aug — Nov 2024', b: ['Owned it from requirements analysis to delivery, including system architecture and interface layout.', 'Implemented map display, path planning and place search with suitable data structures and algorithms.'] } },
  side_car: { sec: 'side',
    zh: { t: '蓝牙循迹避障小车', s: '硬件工程师', m: '2024.09 — 2024.10', b: ['绘制电路原理图，完成元器件选型与焊接。', '基于 STM32 实现电机控制、蓝牙通信、红外循迹与超声波避障。'] },
    en: { t: 'Bluetooth line-following car', s: 'Hardware engineer', m: 'Sep — Oct 2024', b: ['Drew the schematic, selected components and soldered the board.', 'STM32 motor control, Bluetooth communication, IR line tracking and ultrasonic obstacle avoidance.'] } },
  side_serial: { sec: 'side',
    zh: { t: 'STM32F407 串口通信系统', s: '系统工程师', m: '2025.03 — 2025.05', b: ['设计自定义通信协议，支持多类型数据的双向传输。', '集成传感器、舵机等外设，并基于 PyQt5 开发可视化上位机；解决数据丢失、舵机控制等问题。'] },
    en: { t: 'STM32F407 serial system', s: 'Systems engineer', m: 'Mar — May 2025', b: ['Designed a custom protocol for two-way transfer of several data types.', 'Integrated sensors and servos and built a PyQt5 host UI; fixed data-loss and servo-control issues.'] } },
  side_ecg: { sec: 'side',
    zh: { t: '心电信号睡眠分期', s: '机器学习工程师', m: '2025.12', b: ['基于单导联 ECG 开发符合 AASM 标准的五分类睡眠分期流程：信号预处理、R 波检测、RR 间期清洗、HRV/SQI 特征提取。', '针对 100 名受试者构建 XGBoost 模型，采用受试者级 5 折交叉验证与 HMM/Viterbi 时序解码；准确率 51.46% ± 2.49%，Macro-F1 47.16% ± 2.75%，Cohen’s κ 0.351。'] },
    en: { t: 'ECG sleep staging', s: 'Machine learning engineer', m: 'Dec 2025', b: ['Single-lead ECG, AASM 5-class sleep staging: preprocessing, R-peak detection, RR-interval cleaning, HRV/SQI features.', 'XGBoost on 100 subjects with subject-wise 5-fold CV and HMM/Viterbi decoding. Accuracy 51.46% ± 2.49%, macro-F1 47.16% ± 2.75%, Cohen’s κ 0.351.'] } },
  activities: { sec: 'act',
    zh: { t: '公告栏 · 活动与志愿', m: '北京理工大学',
      b: ['北京理工大学国际暑期学校（2022、2023）', '北欧创新创业模拟与实践研学项目', '睿信书院篮球赛裁判',
        '志愿者：北京地铁安全宣传、希望小学 SMC 2024 北京夏令营、云端远程支教；“蓝信封”留守儿童关爱行动宣传大使'] },
    en: { t: 'Notice board · Activities', m: 'BIT',
      b: ['BIT International Summer School (2022, 2023)', 'Nordic innovation and entrepreneurship study program', 'Referee, Ruixin College basketball games',
        'Volunteer: Beijing subway safety campaign, SMC 2024 Hope Primary School summer camp, online remote teaching; ambassador for the “Blue Letter” left-behind children program'] } },
  thesis: { sec: 'exp', chart: true,
    zh: { t: '本科毕业设计', s: '基于教师—学生强化学习的 Unitree G1 地形行走', m: '2025.12 — 2026.04 · 北京理工大学',
      b: ['在 Isaac Gym 中结合地形课程训练特权 PPO 教师策略；用 DAgger 蒸馏出只依赖本体感知历史的学生策略；用 WGAN-GP 对齐师生观测差异。',
        '在固定金字塔地形上，仿真通过率从 46.7% 提升到 68.3%。'], h: '金字塔后面的记分牌，通过率条已经填满了。' },
    en: { t: 'Undergraduate Thesis', s: 'Teacher–student reinforcement learning for Unitree G1 locomotion', m: 'Dec 2025 — Apr 2026 · BIT',
      b: ['Trained a privileged PPO teacher in Isaac Gym with a terrain curriculum; distilled it with DAgger into a student that sees only proprioceptive history; aligned the observation gap with WGAN-GP.',
        'Raised the traversal rate on a fixed pyramid terrain in simulation from 46.7% to 68.3%.'], h: 'The scoreboard past the pyramid has filled in its bars.' } },
  oak: { sec: 'exp',
    zh: { t: '橡树清溪科技 · 强化学习算法实习生', s: '人形机器人通用软件；视频到机器人动作（GVHMR、GMR、NMR / BeyondMimic）', m: '2026.03 — 2026.06 · 北京',
      b: [], h: '往里走有四个工位：速度跟踪、视频到舞蹈、动作数据清洗、loco-manipulation。每个工位都有一只项目小怪，捡起对应的算法打败它。' },
    en: { t: 'OakCreek Tech · RL Algorithm Intern', s: 'Humanoid general-purpose software; video-to-robot motion (GVHMR, GMR, NMR / BeyondMimic)', m: 'Mar — Jun 2026 · Beijing',
      b: [], h: 'Four workstations ahead: velocity tracking, video-to-dance, motion data cleaning, loco-manipulation. Each is guarded by a project monster; grab the matching algorithm to beat it.' } },
  oak_loco: { sec: 'exp', parent: 'oak',
    zh: { lead: 'locomotion（速度跟踪）', b: ['在原有师生学习框架基础上，进一步优化盲走与带感知行走任务，并完成实机部署。从机器人周围的平坦地面取点，与机器人位置连线确定指令速度方向；在策略输入中加入地形标签；在奖励函数中惩罚速度偏角。'] },
    en: { lead: 'Locomotion (velocity tracking)', b: ['Improved blind and perception-based locomotion within an existing teacher–student framework and deployed the policies on hardware. Set command headings from nearby flat-ground samples, added terrain labels to policy inputs, and penalized velocity direction errors.'] } },
  oak_dance: { sec: 'exp', parent: 'oak',
    zh: { lead: '动作跟踪（视频到舞蹈 pipeline）', b: ['围绕 GVHMR-GMR / NMR-BeyondMimic 搭建视频到机器人动作链路；对电机功率和力矩做精细建模，并加入地形随机化与质心随机化，提升 sim-to-real 鲁棒性。'] },
    en: { lead: 'Motion tracking (video-to-dance pipeline)', b: ['Built a GVHMR-GMR / NMR-BeyondMimic pipeline; refined motor power and torque modeling and added terrain and center-of-mass randomization for sim-to-real robustness.'] } },
  oak_clean: { sec: 'exp', parent: 'oak',
    zh: { lead: '动作数据清洗', b: ['开发关键帧编辑器和轨迹后处理工具，对比三种处理 GMR 重定向突变的方法：按舞蹈类型设置平滑参数；先用 HMR 重定向到 G1 再用 GMR 迁移到其他机器人；在仿真中用强化学习 motion tracking 做物理过滤。效果上 HMR 方案最好，物理过滤次之。'] },
    en: { lead: 'Motion data cleaning', b: ['Built a keyframe editor and trajectory post-processor; compared dance-specific smoothing, HMR retargeting to G1 followed by GMR transfer to other robots, and physics filtering via RL motion tracking in simulation. HMR performed best, followed by physics filtering.'] } },
  oak_lm: { sec: 'exp', parent: 'oak',
    zh: { lead: 'loco-manipulation', b: ['复现 HDMI、OmniRetarget 与 SONIC；发现 HDMI 和 OmniRetarget 在仿真中能完成交互动作，但在真机上搬运不同尺寸、攀爬不同高度箱子时泛化较差；用低成本 AprilTag 替代 HDMI 数采链路中的动捕设备。'] },
    en: { lead: 'Loco-manipulation', b: ['Reproduced HDMI, OmniRetarget, and SONIC. HDMI and OmniRetarget worked in simulation but generalized poorly on hardware to carrying different-sized boxes and climbing boxes of varied heights. Replaced motion capture in HDMI data collection with low-cost AprilTag tracking.'] } },
  nus: { sec: 'edu',
    zh: { t: '新加坡国立大学', s: '机器人学硕士，预计 2027.07 毕业', m: '2026.08 — 至今 · 新加坡',
      b: ['LV Robotics Lab（颜水成教授）；Grasping and Manipulation Lab（周建树教授）', '课程：机器学习、机器人学、计算机视觉'] },
    en: { t: 'National University of Singapore', s: 'M.Sc. in Robotics, expected Jul 2027', m: 'Aug 2026 — Present · Singapore',
      b: ['LV Robotics Lab (Prof. Shuicheng Yan); Grasping and Manipulation Lab (Prof. Jianshu Zhou)', 'Coursework: Machine Learning, Robotics, Computer Vision'] } },
  nus_lab: { sec: 'exp',
    zh: { t: '研究学生 · LV Robotics Lab & G&M Lab', s: '面向长时序厨房接触任务的第一视角数据采集与迁移', m: '2026.08 — 至今 · 新加坡国立大学',
      b: ['搭建了从第一视角人类录制到双臂灵巧执行的端到端管线，已在仿真中跑通，正在优化位姿精度和重定向质量。'], h: '管线的三段就在楼外：感知重建、灵巧手重定向、双臂部署，每一段都有一只小怪。' },
    en: { t: 'Research Student · LV Robotics Lab & G&M Lab', s: 'Egocentric data and transfer for long-horizon kitchen contact tasks', m: 'Aug 2026 — Present · NUS',
      b: ['Built an end-to-end pipeline from egocentric human recordings to dual-arm dexterous execution in simulation; now refining pose accuracy and retargeting quality.'], h: 'The three stages of the pipeline are outside: perception, hand retargeting, dual-arm deployment, each guarded by a monster.' } },
  nus_perc: { sec: 'exp', parent: 'nus_lab',
    zh: { lead: '感知与重建', b: ['由 RGB、度量深度和头部位姿恢复相机位姿；将光学动捕骨架拟合到双手 MANO；结合 SAM 3 / SAM 3D 与 PCA/ICP 估计多个刚体在世界坐标系下的 6-DoF 位姿。'] },
    en: { lead: 'Perception', b: ['Recovering camera pose from RGB, metric depth, and head pose; fitting optical-mocap skeletons to bimanual MANO; estimating world-frame 6-DoF poses of multiple rigid objects with SAM 3 / SAM 3D and PCA/ICP.'] } },
  nus_hand: { sec: 'exp', parent: 'nus_lab',
    zh: { lead: '灵巧手重定向', b: ['用 mink 逆运动学把人手示范重定向到 Wuji 灵巧手，再在 MuJoCo 中用 MPPI 优化动作。'] },
    en: { lead: 'Hand retargeting', b: ['Retargeting human hand demonstrations to the Wuji Hand with mink inverse kinematics, then refining the motion with MPPI in MuJoCo.'] } },
  nus_fr3: { sec: 'exp', parent: 'nus_lab',
    zh: { lead: '双臂部署', b: ['将自由腕部轨迹放置到双臂 Franka FR3 上，只求解 14 个手臂关节用于部署。'] },
    en: { lead: 'Dual-arm deployment', b: ['Placing free-wrist trajectories on a dual Franka FR3 and solving only the 14 arm joints for deployment.'] } },
  skills: { sec: 'skill', gems: true,
    zh: { t: '技能石碑', b: [['编程', 'Python、C/C++、PyTorch、CUDA；MATLAB/Simulink、STM32'],
      ['机器人', 'Isaac Gym、Isaac Lab、MuJoCo、mjlab、ROS；强化学习、模仿学习、动作重定向、人形机器人运动与移动操作、sim-to-real'],
      ['语言', '英语 雅思 7.0；普通话一级乙等']] },
    en: { t: 'Skill tablet', b: [['Programming', 'Python, C/C++, PyTorch, CUDA; MATLAB/Simulink, STM32'],
      ['Robotics', 'Isaac Gym, Isaac Lab, MuJoCo, mjlab, ROS; reinforcement learning, imitation learning, motion retargeting, humanoid locomotion and loco-manipulation, sim-to-real'],
      ['Languages', 'English (IELTS 7.0); Mandarin (PSC Level 1-B)']] } },
  contact: { sec: 'contact', contact: true,
    zh: { t: '联系方式', m: '新加坡', b: [['邮箱', EMAIL], ['电话', PHONE], ['方向', '开放人形机器人 / 灵巧操作 / Sim-to-Real 相关机会。']] },
    en: { t: 'Contact', m: 'Singapore', b: [['Email', EMAIL], ['Phone', PHONE], ['Open to', 'Opportunities in humanoid robotics, dexterous manipulation and sim-to-real.']] } },
};
const ENTRY_IDS = Object.keys(ENTRY);
const RESUME = [
  ['edu', [['nus'], ['bit']]],
  ['exp', [['nus_lab', ['nus_perc', 'nus_hand', 'nus_fr3']], ['oak', ['oak_loco', 'oak_dance', 'oak_clean', 'oak_lm']], ['thesis']]],
  ['honor', [['honor_physics'], ['honor_cup'], ['scholar']]],
  ['skill', [['skills']]],
  ['side', [['side_maze'], ['side_map'], ['side_car'], ['side_serial'], ['side_ecg']]],
  ['act', [['activities']]],
];

const ZONES = [
  { id: 'start', x0: 0, x1: 560, cp: 40, w: 'W1-0', g: 'start', d: { zh: '起点', en: 'Start' }, n: { zh: '序章', en: 'Prologue' },
    tip: { zh: '← → 移动 · 空格跳跃 · 鼠标点击射击 · E 互动', en: '← → move · Space jump · click to shoot · E interact' } },
  { id: 'bit', x0: 560, x1: 2000, cp: 580, w: 'W1-1', g: 'bit', d: '2022.09 — 2026.07', n: { zh: '北京理工大学', en: 'Beijing Institute of Technology' },
    tip: { zh: '五个本科项目变成了小怪，捡起对应的工具打败它们', en: 'Five undergrad projects turned into monsters. Grab the matching tool' } },
  { id: 'thesis', x0: 2000, x1: 2800, cp: 2020, w: 'W1-2', g: 'sim', d: '2025.12 — 2026.04', n: { zh: '毕业设计 · 仿真世界', en: 'Thesis · Inside the Sim' },
    tip: { zh: '拿上 PPO、DAgger、WGAN-GP，登顶打败金字塔石魔', en: 'Pick up PPO, DAgger and WGAN-GP, then beat the golem on the pyramid' } },
  { id: 'oak', x0: 2800, x1: 4200, cp: 2810, w: 'W1-3', g: 'oak', d: '2026.03 — 2026.06', n: { zh: '橡树清溪科技', en: 'OakCreek Tech' },
    tip: { zh: '四个工位，四只项目小怪', en: 'Four workstations, four project monsters' } },
  { id: 'air', x0: 4200, x1: GAP0, cp: 4210, w: 'W1-4', g: 'air', d: '2026.08', n: { zh: '北京 · 出发', en: 'Beijing · Departures' },
    tip: { zh: '走上舷梯，飞往新加坡', en: 'Take the stairs and fly to Singapore' } },
  { id: 'nus', x0: GAP1, x1: 6200, cp: 4756, w: 'W2-1', g: 'nus', d: { zh: '2026.08 — 至今', en: '2026.08 — now' }, n: { zh: '新加坡国立大学', en: 'National University of Singapore' },
    tip: { zh: '感知、重定向、部署：管线每一段都有一只小怪', en: 'Perception, retargeting, deployment: one monster per pipeline stage' } },
  { id: 'end', x0: 6200, x1: WORLD_W, cp: 6220, w: 'W2-2', g: 'end', d: { zh: '下一章', en: 'Next chapter' }, n: { zh: '终章 · 下一站', en: 'Next Stop' },
    tip: { zh: '技能石碑、邮箱，还有终点旗', en: 'Skill tablet, mailbox, and the goal flag' } },
];
const ZMAP = Object.fromEntries(ZONES.map((z) => [z.id, z]));
const TL = [[0, 2022, 9], [560, 2022, 9], [2000, 2025, 12], [2800, 2026, 3], [4200, 2026, 7], [GAP0, 2026, 8], [GAP1, 2026, 8], [6200, 2027, 7]];

// Skill gems: most drop from project monsters; entries with x/y float in the world.
const GEMCOL = { code: ['#4fd6e0', '#b5f4f8', '#2a8a9a'], sim: ['#e0457b', '#f7a3c0', '#9a2a55'], method: ['#f2c84b', '#fff1a8', '#c99a2e'], lang: ['#7fdc6a', '#c8f7b8', '#3f9a3a'] };
const GEMS = [
  { id: 'python', n: 'Python', k: 'code' },
  { id: 'cpp', n: 'C/C++', k: 'code' },
  { id: 'matlab', n: 'MATLAB/Simulink', k: 'code' },
  { id: 'stm32', n: 'STM32', k: 'code' },
  { id: 'ielts', n: 'IELTS 7.0', zh: '雅思 7.0', k: 'lang', x: 1850, y: GY - 32 },
  { id: 'rl', n: 'RL', zh: '强化学习', k: 'method' },
  { id: 'isaacgym', n: 'Isaac Gym', k: 'sim' },
  { id: 'pytorch', n: 'PyTorch', k: 'code' },
  { id: 'isaaclab', n: 'Isaac Lab', k: 'sim' },
  { id: 'retarget', n: 'Motion Retargeting', zh: '动作重定向', k: 'method' },
  { id: 's2r', n: 'Sim-to-Real', k: 'method' },
  { id: 'mjlab', n: 'mjlab', k: 'sim' },
  { id: 'il', n: 'Imitation Learning', zh: '模仿学习', k: 'method' },
  { id: 'cuda', n: 'CUDA', k: 'code' },
  { id: 'mujoco', n: 'MuJoCo', k: 'sim' },
  { id: 'ros', n: 'ROS', k: 'sim' },
];
const GEMBY = Object.fromEntries(GEMS.map((g) => [g.id, g]));

// Weapons are the algorithms and tools named in the CV. k = firing pattern; x/y = where the cartridge floats.
const WEAPONS = {
  python: { n: 'Python', code: 'PY', k: 'bolt', c: '#4fd6e0', x: 330 },
  path: { n: 'Path planning', zh: '路径规划', lb: 'PATH PLANNING', code: 'PTH', k: 'seek', c: '#9bd35a', x: 1104 },
  simulink: { n: 'Simulink', code: 'SL', k: 'bolt', c: '#f2c84b', x: 1200 },
  stm32: { n: 'STM32', code: '32', k: 'bolt', c: '#7fdc6a', x: 1400 },
  xgboost: { n: 'XGBoost', code: 'XG', k: 'bolt', c: '#e88a3a', x: 1660 },
  ppo: { n: 'PPO', code: 'PPO', k: 'bolt', c: '#4fd6e0', x: 2221, y: GY - 34 },
  dagger: { n: 'DAgger', code: 'DAG', k: 'dagger', c: '#d6dbe6', x: 2253, y: GY - 54 },
  wgan: { n: 'WGAN-GP', code: 'WG', k: 'twin', c: '#b48cf0', x: 2285, y: GY - 74 },
  ts: { n: 'Teacher–student', zh: '师生框架', lb: 'TEACHER-STUDENT', code: 'T-S', k: 'twin', c: '#f2c84b', x: 3000 },
  gvhmr: { n: 'GVHMR-GMR', code: 'GV', k: 'bolt', c: '#f49ac1', x: 3360 },
  hmr: { n: 'HMR', code: 'HMR', k: 'bolt', c: '#7fdc6a', x: 3610, y: GY - 94 },
  apriltag: { n: 'AprilTag', code: 'TAG', k: 'lob', c: '#eef1f6', x: 3780 },
  icp: { n: 'SAM 3 + ICP', code: 'ICP', k: 'snap', c: '#f2c84b', x: 5136 },
  mink: { n: 'mink IK', code: 'IK', k: 'bolt', c: '#4fd6e0', x: 5415, y: GY - 46 },
  mppi: { n: 'MPPI', code: 'MP', k: 'fan', c: '#e0457b', x: 5496 },
};
const WIDS = Object.keys(WEAPONS);
const PAT = {
  bolt: { cd: 0.26, spd: 230, life: 0.6 }, twin: { cd: 0.34, spd: 220, life: 0.55 }, dagger: { cd: 0.18, spd: 300, life: 0.24 },
  seek: { cd: 0.42, spd: 150, life: 1.3 }, lob: { cd: 0.5, spd: 150, life: 1.4 }, snap: { cd: 0.55, range: 150 }, fan: { cd: 0.5, spd: 210, life: 0.32 },
};

// Every project is a monster. weak = the CV's own method for that project; entry = résumé entry its project gem unlocks.
const MONSTERS = [
  { id: 'm_maze', look: 'ball', type: 'hopper', x: 1290, min: 1238, max: 1348, w: 12, h: 12, hp: 6, weak: ['simulink'], entry: 'side_maze', gems: ['matlab'], n: { zh: '迷宫弹球', en: 'Maze Ball' } },
  { id: 'm_map', look: 'pin', type: 'flyer', x: 1160, y: GY - 64, rx: 44, w: 10, h: 14, hp: 5, weak: ['path'], entry: 'side_map', gems: [], n: { zh: '迷路图钉', en: 'Lost Pin' } },
  { id: 'm_car', look: 'car', type: 'walker', x: 1500, min: 1424, max: 1576, w: 16, h: 10, hp: 6, weak: ['stm32'], entry: 'side_car', gems: ['stm32'], n: { zh: '失控小车', en: 'Runaway Car' } },
  { id: 'm_serial', look: 'gremlin', type: 'turret', x: 1618, w: 12, h: 12, hp: 6, weak: ['stm32'], entry: 'side_serial', gems: ['cpp'], shot: 'bit', n: { zh: '丢包怪', en: 'Packet Gremlin' } },
  { id: 'm_ecg', look: 'heart', type: 'flyer', x: 1790, y: GY - 62, rx: 36, w: 12, h: 11, hp: 6, weak: ['xgboost'], entry: 'side_ecg', gems: [], shot: 'z', n: { zh: '瞌睡心电', en: 'Sleepy Heart' } },
  { id: 'm_golem', look: 'golem', type: 'boss', x: 2460, min: 2434, max: 2490, w: 20, h: 24, hp: 18, weak: ['ppo', 'dagger', 'wgan'], entry: 'thesis', gems: ['rl', 'isaacgym', 'pytorch'], n: { zh: '金字塔石魔', en: 'Pyramid Golem' } },
  { id: 'm_loco', look: 'crawler', type: 'walker', x: 3120, min: 3060, max: 3216, w: 16, h: 9, hp: 7, weak: ['ts'], entry: 'oak_loco', gems: ['isaaclab'], n: { zh: '地形爬虫', en: 'Terrain Crawler' } },
  { id: 'm_dance', look: 'dancer', type: 'hopper', x: 3480, min: 3440, max: 3516, w: 12, h: 22, hp: 7, weak: ['gvhmr'], entry: 'oak_dance', gems: ['retarget', 's2r'], n: { zh: '抖动舞者', en: 'Jitter Dancer' } },
  { id: 'm_spike', look: 'spike', type: 'flyer', x: 3700, y: GY - 70, rx: 40, w: 16, h: 10, hp: 6, weak: ['hmr'], entry: 'oak_clean', gems: ['mjlab'], n: { zh: '重定向尖刺', en: 'Retarget Spike' } },
  { id: 'm_box', look: 'mimic', type: 'walker', x: 3900, min: 3852, max: 3944, w: 16, h: 14, hp: 7, weak: ['apriltag'], entry: 'oak_lm', gems: ['il'], n: { zh: '箱子怪', en: 'Box Mimic' } },
  { id: 'm_pose', look: 'cup', type: 'flyer', x: 5290, y: GY - 60, rx: 40, w: 12, h: 12, hp: 7, weak: ['icp'], entry: 'nus_perc', gems: ['cuda'], n: { zh: '位姿幽灵', en: 'Pose Ghost' } },
  { id: 'm_hand', look: 'ghosthand', type: 'flyer', x: 5600, y: GY - 64, rx: 40, w: 14, h: 16, hp: 8, weak: ['mink', 'mppi'], entry: 'nus_hand', gems: ['mujoco'], n: { zh: '幻影手', en: 'Phantom Hand' } },
  { id: 'm_arm', look: 'arm', type: 'turret', x: 5812, w: 14, h: 20, hp: 8, weak: ['mink'], entry: 'nus_fr3', gems: ['ros'], shot: 'spark', n: { zh: '失控机械臂', en: 'Rogue Arm' } },
];
const MONBY = Object.fromEntries(MONSTERS.map((m) => [m.id, m]));
const BUGS = [{ x: 450, min: 420, max: 500 }, { x: 1060, min: 1040, max: 1110 }, { x: 2950, min: 2920, max: 2990 }, { x: 4080, min: 4050, max: 4120 }, { x: 5920, min: 5880, max: 5960 }];

const ACH = [
  { id: 'hello', zh: ['Hello, World', '第一次互动'], en: ['Hello, World', 'First interaction'] },
  { id: 'firstkill', zh: ['初战告捷', '打败第一只小怪'], en: ['First win', 'Defeated your first monster'] },
  { id: 'boss', zh: ['推倒石魔', '通过率 46.7% → 68.3%'], en: ['Golem down', 'Traversal 46.7% → 68.3%'] },
  { id: 'dance', zh: ['登台', '站上了舞蹈台'], en: ['On stage', 'Stood on the dance stage'] },
  { id: 'flight', zh: ['BJS → SIN', '飞往新加坡'], en: ['BJS → SIN', 'Flew to Singapore'] },
  { id: 'gems', zh: ['技能全收集', '16 / 16 技能宝石'], en: ['Full skill tree', 'All 16 skill gems'] },
  { id: 'allprojects', zh: ['项目全攻克', '13 只项目小怪全部击败'], en: ['All projects cleared', 'Beat all 13 project monsters'] },
  { id: 'all', zh: ['简历通关', '读完全部条目'], en: ['Résumé complete', 'Read every entry'] },
  { id: 'goal', zh: ['抵达终点', '升起终点旗'], en: ['Goal', 'Raised the flag'] },
  { id: 'hardboss', zh: ['高难石魔', '困难或硬核难度下推倒金字塔石魔'], en: ['Golem on Hard', 'Beat the Pyramid Golem on Hard or Hardcore'] },
  { id: 'hardcore', zh: ['硬核全攻克', '硬核难度下打败全部 13 只项目小怪'], en: ['Hardcore clear', 'Beat all 13 project monsters on Hardcore'] },
];

// Combat difficulty. dmg/pit: HP lost per hit / per fall; monHp, spd, cd, aggro, bullet: monster multipliers;
// spread: shots per volley; chip: damage factor for non-matching weapons; boss: golem wave tier (2 also enrages below half HP).
const DIFFS = ['story', 'normal', 'hard', 'hardcore'];
const DIFF = {
  story: { n: { zh: '观光', en: 'Story' }, d: { zh: '小怪伤不到你，适合只想看简历内容', en: 'Monsters can’t hurt you. For reading the résumé' },
    hp: 6, dmg: 0, pit: 0, inv: 1.1, monHp: 0.8, spd: 0.85, cd: 1.3, aggro: 0.9, bullet: 0.85, spread: 1, chip: 1, stomp: 2, coffeeBug: 0.4, coffeeBoss: 'any', boss: 0 },
  normal: { n: { zh: '普通', en: 'Normal' }, d: { zh: '默认难度：HP 6，受击扣 1', en: 'The default: 6 HP, each hit costs 1' },
    hp: 6, dmg: 1, pit: 1, inv: 1.1, monHp: 1, spd: 1, cd: 1, aggro: 1, bullet: 1, spread: 1, chip: 1, stomp: 2, coffeeBug: 0.4, coffeeBoss: 'any', boss: 0 },
  hard: { n: { zh: '困难', en: 'Hard' }, d: { zh: 'HP 5；小怪血量 ×1.6，更快、更凶、出手更频繁；咖啡变少', en: '5 HP; monsters have 1.6× HP and are faster and more aggressive; less coffee' },
    hp: 5, dmg: 1, pit: 1, inv: 0.9, monHp: 1.6, spd: 1.25, cd: 0.7, aggro: 1.25, bullet: 1.3, spread: 1, chip: 1, stomp: 2, coffeeBug: 0.2, coffeeBoss: 'half', boss: 1 },
  hardcore: { n: { zh: '硬核', en: 'Hardcore' }, d: { zh: 'HP 4，每次受击扣 2；只有对应的武器才有效；射手三连发，石魔会暴怒；没有咖啡', en: '4 HP and every hit costs 2; only the matching weapon works; shooters fire spreads and the golem enrages; no coffee' },
    hp: 4, dmg: 2, pit: 2, inv: 0.8, monHp: 2, spd: 1.45, cd: 0.5, aggro: 1.5, bullet: 1.5, spread: 3, chip: 0, stomp: 1, coffeeBug: 0, coffeeBoss: false, boss: 2 },
};

const U = {
  zh: {
    tSub: '一份可以玩的简历。项目变成了小怪：捡起对应的算法和工具打败它们，拿到项目宝石和技能宝石。',
    tStart: '开始游戏', tContinue: '继续冒险', tNew: '从头开始', tQuick: '直接看简历', press: 'PRESS ENTER',
    tKeys: '← → 移动　空格 跳跃　鼠标点击 射击　E 互动　C 换武器　Q 简历', tKeysTouch: '◀ ▶ 移动　A 跳跃　点画面 射击　B 互动　点武器栏换武器',
    hudXP: '简历', hudGem: '技能', bResume: '简历', bMap: '地图', bSkills: '技能', bMenu: '菜单', soundOn: '音效 开', soundOff: '音效 关',
    padAct: '互动', padJump: '跳跃', padAtk: '攻击', wLbl: '武器', noWeapon: '空手',
    close: '关闭', closeKey: '关闭 [E]', viewInResume: '在简历中查看', found: '已发现', notFound: '还没在游戏里找到', findInGame: '在游戏里找到它',
    tabResume: '简历', tabMap: '地图', tabSkills: '技能与成就', tabHelp: '设置',
    copyEmail: '复制邮箱', copied: '邮箱已复制', copyFail: '已选中邮箱，请手动复制', dlCV: '下载 PDF 简历', backSite: '返回个人主页',
    go: '传送', here: '你在这里', explored: '已探索', gemsTitle: '技能宝石', achTitle: '成就', locked: '未解锁',
    newEntry: '简历条目', gemGot: '获得技能', achGot: '成就解锁',
    gotWeapon: '获得武器', strongVs: '克制', weakTo: '弱点', anyWeapon: '任何武器都行',
    attackKb: '点鼠标朝那个方向射击，按 J 自动瞄准；前面的 Bug 可以拿来练手', attackTouch: '点画面朝那里射击，按 X 自动瞄准；前面的 Bug 可以拿来练手', needWeapon: '先捡起一个武器：发光的卡带',
    cleared: '项目攻克', respawn: 'HP 归零 · 回到检查点', fell: '掉下去了',
    arsenal: '武器库', bestiary: '项目小怪', defeated: '已击败', notDefeated: '未击败',
    diffLbl: '难度', diffSet: '难度已切换', onlyWeak: '其他武器无效',
    rematch: '重新挑战', rematchHint: '复活全部项目小怪，用当前难度再打一遍；简历进度、武器和宝石都保留', rematchConfirm: '再点一次确认复活', rematchDone: '项目小怪已全部复活',
    flightTo: '北京 → 新加坡', flightBack: '新加坡 → 北京', board: '登机', flyBack: '飞回北京',
    endKicker: 'THANKS FOR PLAYING', endTitle: '感谢游玩', endSub: '存档到此为止，下一章还在写。如果这份简历和你的方向对得上，欢迎联系。',
    stEntries: '简历条目', stGems: '技能宝石', stAch: '成就', stTime: '用时', stKills: '项目小怪',
    keepExploring: '继续探索', fullResume: '查看完整简历', playAgain: '重新开始',
    keysTitle: '键盘', touchTitle: '触屏与鼠标', sfx: '音效', music: '背景音乐', language: '语言', on: '开', off: '关', progress: '进度',
    resetBtn: '清除进度', resetConfirm: '再点一次确认清除', resetDone: '进度已清除',
    keys: [['← → / A D', '移动'], ['Shift', '奔跑'], ['空格 / W / ↑ / K', '跳跃'], ['↓ / S', '从平台上跳下'], ['鼠标左键', '朝鼠标方向射击（按住连发）'], ['J / X', '自动瞄准最近的小怪'], ['C', '切换武器'],
      ['E / Enter', '互动、关闭对话'], ['Q', '简历速览'], ['M', '地图'], ['Esc', '菜单 / 关闭'], ['L', '切换语言']],
    touchHelp: '屏幕下方 ◀ ▶ 移动，A 跳跃，X 自动瞄准攻击，B 互动；点左上角的武器栏切换武器。手指点画面会朝那个方向射击，按住连发；点物体会打开它。鼠标同理。',
    chartBefore: '优化前', chartAfter: '优化后', chartCap: '固定金字塔地形 · 仿真通过率（%）',
    profileLine: '具身智能 · 机器人学习 · 灵巧操作 · Sim-to-Real', name: '邹浩东', loc: '新加坡',
  },
  en: {
    tSub: 'A résumé you can play. The projects have turned into monsters: grab the matching algorithm or tool, beat them, and collect project and skill gems.',
    tStart: 'Start', tContinue: 'Continue', tNew: 'New game', tQuick: 'Read the résumé', press: 'PRESS ENTER',
    tKeys: '← → move   Space jump   Click to shoot   E interact   C weapon   Q résumé', tKeysTouch: '◀ ▶ move   A jump   Tap to shoot   B interact   tap the weapon slot to switch',
    hudXP: 'CV', hudGem: 'GEM', bResume: 'CV', bMap: 'MAP', bSkills: 'SKILLS', bMenu: 'MENU', soundOn: 'SFX ON', soundOff: 'SFX OFF',
    padAct: 'act', padJump: 'jump', padAtk: 'attack', wLbl: 'WPN', noWeapon: 'None',
    close: 'Close', closeKey: 'Close [E]', viewInResume: 'View in résumé', found: 'Found', notFound: 'Not found in game yet', findInGame: 'Find it in the game',
    tabResume: 'Résumé', tabMap: 'Map', tabSkills: 'Skills', tabHelp: 'Settings',
    copyEmail: 'Copy email', copied: 'Email copied', copyFail: 'Email selected; copy it manually', dlCV: 'Download PDF CV', backSite: 'Back to homepage',
    go: 'Go', here: 'You are here', explored: 'Explored', gemsTitle: 'Skill gems', achTitle: 'Achievements', locked: 'Locked',
    newEntry: 'Résumé entry', gemGot: 'Skill acquired', achGot: 'Achievement',
    gotWeapon: 'Weapon acquired', strongVs: 'Strong vs', weakTo: 'Weak to', anyWeapon: 'any weapon works',
    attackKb: 'Click to shoot where the mouse points, or press J to auto-aim. Practice on the bug ahead', attackTouch: 'Tap to shoot that way, or press X to auto-aim. Practice on the bug ahead', needWeapon: 'Pick up a weapon first: a glowing cartridge',
    cleared: 'Project cleared', respawn: 'Out of HP · back to the checkpoint', fell: 'Fell in',
    arsenal: 'Arsenal', bestiary: 'Project monsters', defeated: 'Defeated', notDefeated: 'Not yet',
    diffLbl: 'Difficulty', diffSet: 'Difficulty', onlyWeak: 'other weapons resist',
    rematch: 'Rematch', rematchHint: 'Revive every project monster to fight them again on the current difficulty. Résumé progress, weapons and gems are kept.', rematchConfirm: 'Click again to revive', rematchDone: 'All project monsters revived',
    flightTo: 'Beijing → Singapore', flightBack: 'Singapore → Beijing', board: 'Board', flyBack: 'Fly back to Beijing',
    endKicker: 'THANKS FOR PLAYING', endTitle: 'Thanks for playing', endSub: 'That is the save file so far; the next chapter is still being written. If this résumé fits what you are building, get in touch.',
    stEntries: 'Entries', stGems: 'Gems', stAch: 'Achievements', stTime: 'Time', stKills: 'Monsters',
    keepExploring: 'Keep exploring', fullResume: 'Full résumé', playAgain: 'Play again',
    keysTitle: 'Keyboard', touchTitle: 'Touch and mouse', sfx: 'Sound', music: 'Music', language: 'Language', on: 'On', off: 'Off', progress: 'Progress',
    resetBtn: 'Clear progress', resetConfirm: 'Click again to clear', resetDone: 'Progress cleared',
    keys: [['← → / A D', 'Move'], ['Shift', 'Run'], ['Space / W / ↑ / K', 'Jump'], ['↓ / S', 'Drop through a platform'], ['Left click', 'Shoot toward the mouse (hold to repeat)'], ['J / X', 'Auto-aim at the nearest monster'], ['C', 'Switch weapon'],
      ['E / Enter', 'Interact, close dialog'], ['Q', 'Résumé'], ['M', 'Map'], ['Esc', 'Menu / close'], ['L', 'Switch language']],
    touchHelp: 'Use ◀ ▶ to move, A to jump, X to auto-aim, B to interact; tap the weapon slot at the top left to switch. Tapping the scene shoots toward your finger (hold to repeat); tapping an object opens it. The mouse works the same way.',
    chartBefore: 'Before', chartAfter: 'After', chartCap: 'Fixed pyramid terrain · traversal rate in simulation (%)',
    profileLine: 'Embodied AI · Robot Learning · Dexterous Manipulation · Sim-to-Real', name: 'Haodong Zou', loc: 'Singapore',
  },
};

// ===================== canvas primitives =====================
const cv = $('#cv'); const ctx = cv.getContext('2d');
let T = 0; // seconds
function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function L(x0, y0, x1, y1, c, t = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  ctx.fillStyle = c; const o = Math.floor(t / 2);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (let i = 0; i < 600; i++) { ctx.fillRect(x0 - o, y0 - o, t, t); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
function dots(x0, y0, x1, y1, c, gap = 3) { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / gap)); for (let i = 0; i <= n; i++) R(lerp(x0, x1, i / n), lerp(y0, y1, i / n), 1, 1, c); }
function disc(g, cx, cy, r, c) { g.fillStyle = c; for (let y = -r; y <= r; y++) { const hw = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1); } }
function ring(cx, cy, r, c) { const n = Math.max(12, Math.round(r * 6)); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; R(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, c); } }
function txt(s, x, y, c, sc = 1, al = 0) { const im = txtImg(String(s), c); const w = im.width * sc; const xx = Math.round(al === 1 ? x - w / 2 : al === 2 ? x - w : x); ctx.drawImage(im, xx, Math.round(y), w, 7 * sc); return w; }
function txtS(s, x, y, c, sc = 1, al = 0) { txt(s, x + sc, y + sc, C.ink, sc, al); return txt(s, x, y, c, sc, al); }
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];

// ===================== hero sprite (black tee with magenta seams, from the CV photo) =====================
function heroFrame(kind, f) {
  const c = mk(16, 24), g = c.getContext('2d');
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const bob = kind === 'idle' ? (f === 1 ? 1 : 0) : kind === 'walk' ? (f % 2 === 0 ? 1 : 0) : 0;
  let lb = 0, lf = 0, liftB = 0, liftF = 0, armUp = false;
  if (kind === 'walk') { const P = [[-2, 2], [0, 0], [2, -2], [0, 0]][f]; lb = P[0]; lf = P[1]; if (f === 1) liftF = 1; if (f === 3) liftB = 1; }
  if (kind === 'jump') { lb = -1; lf = 2; liftB = 1; liftF = 2; armUp = true; }
  if (kind === 'fall') { lb = -2; lf = 1; liftF = 1; }
  const leg = (x, lift, col) => { r(x, 20 - lift, 3, 3, col); r(x, 23 - lift, 4, 1, lift ? C.lgray : C.white); };
  leg(4 + lb, liftB, C.denimD); leg(8 + lf, liftF, C.denim);
  const y = bob;
  // back arm
  if (armUp) { r(3, 12 + y, 1, 2, C.teeD); r(3, 10 + y, 1, 2, C.skinD); } else { r(3, 13 + y, 1, 3, C.teeD); r(3 - (lf > 0 ? 1 : 0), 16 + y, 1, 2, C.skinD); }
  // torso
  r(4, 13 + y, 8, 6, C.tee); r(4, 18 + y, 8, 1, C.teeD); r(4, 19 + y, 8, 1, C.denim);
  r(6, 13 + y, 4, 1, C.mag); r(5, 14 + y, 1, 1, C.mag); r(4, 15 + y, 1, 1, C.mag); r(10, 14 + y, 1, 1, C.mag); r(11, 15 + y, 1, 1, C.mag);
  // head
  r(5, 0 + y, 6, 1, C.hair); r(3, 1 + y, 10, 1, C.hair); r(2, 2 + y, 12, 2, C.hair); r(5, 2 + y, 3, 1, C.hairH); r(4, 3 + y, 2, 1, C.hairH);
  r(4, 4 + y, 10, 7, C.skin); r(5, 11 + y, 8, 1, C.skin); r(13, 10 + y, 1, 1, C.skinD); r(6, 12 + y, 6, 1, C.skinD);
  r(2, 4 + y, 3, 5, C.hair); r(3, 9 + y, 2, 1, C.hair); r(5, 6 + y, 1, 2, C.skinD);
  r(4, 4 + y, 10, 1, C.hair); r(5, 5 + y, 3, 1, C.hair); r(9, 5 + y, 4, 1, C.hair); r(12, 6 + y, 1, 1, C.hair);
  r(7, 6 + y, 2, 1, C.hair); r(10, 6 + y, 1, 1, C.hair);
  r(8, 7 + y, 1, 2, C.hair); r(11, 7 + y, 1, 2, C.hair); r(13, 8 + y, 1, 1, C.skinD); r(10, 10 + y, 2, 1, '#c9786a');
  // front arm
  if (armUp) { r(12, 12 + y, 1, 2, C.tee); r(12, 10 + y, 1, 2, C.skin); } else { r(12, 13 + y, 1, 3, C.tee); r(12 + (lf < 0 ? 1 : 0), 16 + y, 1, 2, C.skin); }
  return c;
}
function flipC(src) { const c = mk(src.width, src.height), g = c.getContext('2d'); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; }
const HERO = {};
for (const [k, n] of [['idle', 2], ['walk', 4], ['jump', 1], ['fall', 1]]) { HERO[k] = []; for (let i = 0; i < n; i++) { const fr = heroFrame(k, i); HERO[k].push([fr, flipC(fr)]); } }

// ===================== tree sprites =====================
function makeGinkgo(seed) {
  const c = mk(40, 56), g = c.getContext('2d'), rnd = rng(seed);
  g.fillStyle = '#6b4a34'; g.fillRect(18, 28, 4, 28); g.fillRect(14, 30, 4, 2); g.fillRect(22, 26, 5, 2);
  const blobs = []; for (let i = 0; i < 13; i++) blobs.push([20 + (rnd() - 0.5) * 22, 19 + (rnd() - 0.5) * 18, 5 + rnd() * 5]);
  for (const b of blobs) disc(g, b[0], b[1] + 1, b[2] + 1, '#b0782a');
  for (const b of blobs) disc(g, b[0], b[1], b[2], '#e0a93a');
  for (const b of blobs) disc(g, b[0] - 1.5, b[1] - 2, Math.max(2, b[2] - 3), C.gold);
  g.fillStyle = '#fbe38a'; for (let i = 0; i < 16; i++) g.fillRect(Math.round(8 + rnd() * 24), Math.round(6 + rnd() * 20), 1, 1);
  return c;
}
function makePalm(seed) {
  const c = mk(48, 70), g = c.getContext('2d'), rnd = rng(seed);
  for (let y = 70; y > 16; y--) { const k = (70 - y) / 54; const x = 24 + Math.sin(k * 2.2) * 5 * (seed % 2 ? 1 : -1); g.fillStyle = (y % 5 === 0) ? '#6b5034' : '#8a6a45'; g.fillRect(Math.round(x) - 1, y, 3, 1); }
  const tx = 24 + Math.sin(2.2) * 5 * (seed % 2 ? 1 : -1), ty = 16;
  const fr = [[-1, -0.35], [-0.8, 0.15], [-0.45, 0.5], [0.45, 0.5], [0.8, 0.15], [1, -0.35], [0.05, -1]];
  for (const [dx, dy] of fr) {
    for (let i = 0; i < 18; i++) { const k = i / 18; const x = tx + dx * 20 * k, y = ty + dy * 12 * k + k * k * 9; g.fillStyle = i % 3 ? '#2f8a4a' : '#46a85a'; g.fillRect(Math.round(x), Math.round(y), 2, 1); if (i > 4 && i % 2) { g.fillStyle = '#25703c'; g.fillRect(Math.round(x), Math.round(y) + 1, 1, 2); } }
  }
  g.fillStyle = '#6b4a2a'; g.fillRect(Math.round(tx) - 2, ty + 2, 2, 2); g.fillRect(Math.round(tx) + 1, ty + 3, 2, 2);
  void rnd; return c;
}
const GINKGO = [makeGinkgo(3), makeGinkgo(11), makeGinkgo(29)];
const PALM = [makePalm(4), makePalm(7)];

// ===================== skies =====================
const SKYSTOPS = {
  start: ['#1f2340', '#3a3a6b', '#7a4f8f', '#e0607b', '#f2a07a', '#f7d39a'],
  bit: ['#4f8fd6', '#6fa8e0', '#8fc3e8', '#b5d9ef', '#d6ecf5', '#eef6f8'],
  sim: ['#0b1122', '#0f1730', '#131d3b', '#172447', '#1b2b53', '#20335f'],
  oak: ['#2b2240', '#4b2f55', '#8a3f5a', '#c9604f', '#e88a4a', '#f2b05a'],
  air: ['#23284d', '#3d3466', '#6b3f73', '#a8506e', '#d9706a', '#f0a070'],
  nus: ['#1f5f7f', '#3f8faa', '#7fbfc4', '#f2d08a', '#f5a56a', '#f07a6a'],
  end: ['#07081a', '#0b0d26', '#111536', '#181d47', '#212656', '#2c2f63'],
};
function makeSky(st) {
  const c = mk(2, H), g = c.getContext('2d'); const N = 16, bh = Math.ceil(GY / N); let prev = null;
  for (let i = 0; i < N; i++) { const col = stopsAt(st, i / (N - 1)); g.fillStyle = col; g.fillRect(0, i * bh, 2, bh); if (prev) { g.fillStyle = prev; g.fillRect(0, i * bh, 1, 1); g.fillRect(1, i * bh + 1, 1, 1); } prev = col; }
  g.fillStyle = st[st.length - 1]; g.fillRect(0, N * bh, 2, H); return c;
}
const SKY = {}; for (const k in SKYSTOPS) SKY[k] = ctx.createPattern(makeSky(SKYSTOPS[k]), 'repeat');
const STARS = (() => { const r = rng(77), a = []; for (let i = 0; i < 90; i++) a.push({ x: r() * 600, y: r() * GY * 0.62, p: r() * 6, b: r() < 0.15 }); return a; })();

// ===================== parallax layers (seamless tiles) =====================
const per = (x, w, k, ph) => Math.sin((x / w) * Math.PI * 2 * k + ph);
function ridge(g, w, base, ks, col, yb = GY) { g.fillStyle = col; for (let x = 0; x < w; x++) { let h = base; for (const [k, a, p] of ks) h += a * per(x, w, k, p); g.fillRect(x, Math.round(yb - h), 1, Math.round(h) + 60); } }
function skyline(g, w, rnd, col, win, minH, maxH, minW, maxW, yb = GY) {
  let x = 0; while (x < w) { const bw = minW + Math.floor(rnd() * (maxW - minW)); const bh = minH + Math.floor(rnd() * (maxH - minH)); const ww = Math.min(bw, w - x);
    g.fillStyle = col; g.fillRect(x, yb - bh, ww, bh + 60);
    if (win) { g.fillStyle = win; for (let yy = yb - bh + 4; yy < yb - 3; yy += 5) for (let xx = x + 2; xx < x + ww - 2; xx += 4) if (rnd() < 0.35) g.fillRect(xx, yy, 1, 2); }
    x += bw + Math.floor(rnd() * 3); }
}
function wrapDraw(w, x, width, fn) { fn(x); if (x + width > w) fn(x - w); if (x < 0) fn(x + w); }
const FAR_W = 480, MID_W = 560;
const PAINT = {
  start: {
    far(g, w, rnd) { disc(g, w * 0.3, GY - 40, 20, '#f7d39a'); disc(g, w * 0.3, GY - 40, 15, '#fbe6b8'); ridge(g, w, 30, [[2, 10, 0], [5, 5, 1]], '#4b3a73'); g.fillStyle = C.gold; for (let i = 0; i < 14; i++) g.fillRect(Math.floor(rnd() * w), GY - 6 - Math.floor(rnd() * 14), 1, 1); },
    mid(g, w, rnd) { ridge(g, w, 16, [[3, 7, 2], [7, 3, 0]], '#2f2552'); g.fillStyle = '#241d42'; for (let i = 0; i < 9; i++) { const x = Math.floor(rnd() * w), h = 10 + rnd() * 14; wrapDraw(w, x, 10, (xx) => { for (let y = 0; y < h; y++) { const hw = Math.round((y / h) * 5); g.fillRect(xx + 5 - hw, GY - 12 - h + y, hw * 2 + 1, 1); } g.fillRect(xx + 4, GY - 12, 2, 6); }); } },
  },
  bit: {
    far(g, w, rnd) { ridge(g, w, 44, [[2, 14, 0.5], [5, 6, 0]], '#b3c9dc'); skyline(g, w, rnd, '#93abc6', '#b5c9dd', 12, 46, 10, 26); g.fillStyle = '#93abc6'; g.fillRect(Math.floor(w * 0.62), GY - 74, 8, 74); g.fillRect(Math.floor(w * 0.62) + 3, GY - 84, 2, 10); },
    mid(g, w, rnd) {
      let x = 10; while (x < w - 60) { const bw = 80 + Math.floor(rnd() * 40), bh = 46 + Math.floor(rnd() * 22);
        g.fillStyle = '#d9d0bf'; g.fillRect(x, GY - bh, bw, bh); g.fillStyle = '#b8ac96'; g.fillRect(x, GY - bh, bw, 3); g.fillStyle = '#8a6a5a'; g.fillRect(x - 3, GY - bh - 3, bw + 6, 3);
        g.fillStyle = '#6f95c4'; for (let yy = GY - bh + 8; yy < GY - 8; yy += 10) for (let xx = x + 5; xx < x + bw - 6; xx += 9) g.fillRect(xx, yy, 5, 6);
        g.fillStyle = '#c9c0ac'; g.fillRect(x, GY - 6, bw, 6); x += bw + 40 + Math.floor(rnd() * 30); }
      for (let i = 0; i < 4; i++) { const tx = Math.floor(rnd() * (w - 30)); g.drawImage(GINKGO[i % 3], tx, GY - 42, 30, 42); }
    },
  },
  sim: {
    far(g, w) { g.fillStyle = '#16213d'; for (let x = 0; x < w; x += 24) g.fillRect(x, 0, 1, GY); for (let y = 20; y < GY; y += 24) g.fillRect(0, y, w, 1);
      g.fillStyle = '#2f5590'; for (let x = 0; x < w; x++) { let h = 46; h += 16 * per(x, w, 2, 1) + 7 * per(x, w, 5, 0); g.fillRect(x, Math.round(GY - h), 1, 1); } },
    mid(g, w) {
      const rows = [[GY - 44, 20, 5, '#1a2a4f', '#2a4778'], [GY - 26, 28, 7, '#1d3058', '#335996'], [GY - 8, 35, 9, '#213665', '#3f6fb5']];
      for (const [yb, tw, rh, fl, rc] of rows) for (let x = 0; x < w; x += tw) {
        g.fillStyle = fl; g.fillRect(x + 1, yb, tw - 2, 3); g.fillStyle = '#2a4778'; g.fillRect(x + 1, yb, tw - 2, 1);
        const cx = x + Math.floor(tw / 2), s = rh; g.fillStyle = rc; g.fillRect(cx - 1, yb - s, 3, Math.ceil(s * 0.3)); g.fillRect(cx - 1, yb - Math.ceil(s * 0.7), 3, Math.ceil(s * 0.4)); g.fillRect(cx - 2, yb - Math.ceil(s * 0.3), 1, Math.ceil(s * 0.3)); g.fillRect(cx + 1 + ((x / tw) % 2), yb - Math.ceil(s * 0.3), 1, Math.ceil(s * 0.3));
      }
    },
  },
  oak: {
    far(g, w) { g.fillStyle = '#3a2a45'; g.fillRect(0, 0, w, GY); for (let i = 0; i < 4; i++) { const x = 20 + i * 120; g.fillStyle = '#241a30'; g.fillRect(x - 3, 30, 96, 96);
      for (let y = 0; y < 90; y++) { g.fillStyle = mix('#f2b05a', '#c9604f', y / 90); g.fillRect(x, 33 + y, 90, 1); }
      g.fillStyle = '#8a3f5a'; for (let b = 0; b < 6; b++) { const bh = 12 + ((b * 37 + i * 11) % 30); g.fillRect(x + b * 15, 123 - bh, 13, bh); }
      g.fillStyle = '#241a30'; g.fillRect(x + 44, 33, 3, 90); g.fillRect(x, 76, 90, 3); }
      g.fillStyle = '#2b2038'; g.fillRect(0, 0, w, 14); for (let x = 0; x < w; x += 40) g.fillRect(x, 14, 4, 8); },
    mid(g, w, rnd) {
      for (let x = 0; x < w; x += 140) { g.fillStyle = '#4b4258'; g.fillRect(x, 0, 10, GY); g.fillStyle = '#5f566e'; g.fillRect(x, 0, 2, GY); }
      for (let i = 0; i < 3; i++) { const x = 30 + i * 180; g.fillStyle = '#5a4a3a'; g.fillRect(x, GY - 52, 70, 3); g.fillRect(x, GY - 28, 70, 3); g.fillRect(x, GY - 52, 3, 52); g.fillRect(x + 67, GY - 52, 3, 52);
        for (let k = 0; k < 8; k++) { g.fillStyle = [C.gray, C.orange, C.cyan, C.lgray, C.mag][Math.floor(rnd() * 5)]; g.fillRect(x + 5 + k * 8, GY - 58 + Math.floor(rnd() * 2), 5, 6); g.fillRect(x + 5 + k * 8, GY - 34, 5, 6); }
        const rx = x + 100; g.fillStyle = '#2b2240'; g.fillRect(rx + 2, GY - 34, 5, 5); g.fillRect(rx, GY - 28, 9, 12); g.fillRect(rx + 1, GY - 16, 3, 14); g.fillRect(rx + 5, GY - 16, 3, 14); g.fillRect(rx - 2, GY - 27, 2, 10); g.fillRect(rx + 9, GY - 27, 2, 10); g.fillRect(rx - 3, GY - 2, 15, 2); }
      for (let x = 70; x < w; x += 140) { g.fillStyle = '#2b2038'; g.fillRect(x, 0, 1, 34); g.fillStyle = '#5a4a3a'; g.fillRect(x - 6, 34, 13, 4); g.fillStyle = '#fff1a8'; g.fillRect(x - 4, 38, 9, 1); }
    },
  },
  air: {
    far(g, w) { g.fillStyle = '#2b2a50'; for (let x = 0; x < w; x += 24) g.fillRect(x, 20, 2, GY); for (let y = 20; y < GY; y += 30) g.fillRect(0, y, w, 2); g.fillRect(0, 12, w, 8);
      const tx = Math.floor(w * 0.6); g.fillRect(tx, GY - 90, 8, 90); g.fillRect(tx - 6, GY - 102, 20, 12); g.fillStyle = '#6a8ab0'; g.fillRect(tx - 4, GY - 99, 16, 4); },
    mid(g, w) { g.fillStyle = '#3a3a5a'; for (let i = 0; i < 3; i++) { const x = 40 + i * 180; g.fillRect(x, GY - 36, 70, 12); g.fillRect(x + 10, GY - 24, 3, 24); g.fillRect(x + 55, GY - 24, 3, 24); g.fillStyle = '#2b2a50'; g.fillRect(x + 90, GY - 30, 50, 10); for (let r = 0; r < 14; r++) g.fillRect(x + 92 + Math.round(r * 0.5), GY - 30 - r, 8, 1); g.fillStyle = '#3a3a5a'; } },
  },
  nus: {
    far(g, w, rnd) {
      g.fillStyle = '#2f7f9a'; g.fillRect(0, GY - 16, w, 20); g.fillStyle = '#7fbfc4'; for (let i = 0; i < 40; i++) g.fillRect(Math.floor(rnd() * w), GY - 15 + Math.floor(rnd() * 14), 3 + Math.floor(rnd() * 5), 1);
      skyline(g, w, rnd, '#4a5f7f', '#f2d08a', 14, 44, 8, 20, GY - 16);
      const fx = Math.floor(w * 0.2); g.fillStyle = '#3a4f6f'; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; g.fillRect(Math.round(fx + Math.cos(a) * 24), Math.round(GY - 54 + Math.sin(a) * 24), 1, 1); }
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; for (let k = 2; k < 24; k += 3) g.fillRect(Math.round(fx + Math.cos(a) * k), Math.round(GY - 54 + Math.sin(a) * k), 1, 1); }
      g.fillRect(fx - 10, GY - 30, 2, 14); g.fillRect(fx + 8, GY - 30, 2, 14);
      const mx = Math.floor(w * 0.55); g.fillStyle = '#3a4f6f'; for (let i = 0; i < 3; i++) g.fillRect(mx + i * 16, GY - 70, 10, 56); g.fillRect(mx - 6, GY - 74, 50, 4); g.fillRect(mx + 40, GY - 73, 6, 2);
      const sx = Math.floor(w * 0.82); for (let i = 0; i < 3; i++) { const x = sx + i * 14, h = 30 + (i % 2) * 10; g.fillStyle = '#3f6a6a'; g.fillRect(x, GY - 16 - h, 2, h); for (let r = 0; r < 5; r++) g.fillRect(x - 6 + r, GY - 16 - h - 5 + r, 14 - r * 2, 1); }
    },
    mid(g, w, rnd) {
      for (let i = 0; i < 2; i++) { const x = 60 + i * 280, bw = 110, bh = 54; g.fillStyle = '#ece8df'; g.fillRect(x, GY - bh, bw, bh); g.fillStyle = C.nusO; g.fillRect(x, GY - bh, bw, 4); g.fillRect(x, GY - bh + 26, bw, 2);
        g.fillStyle = '#4a7ab8'; for (let yy = GY - bh + 9; yy < GY - 8; yy += 13) for (let xx = x + 5; xx < x + bw - 8; xx += 12) g.fillRect(xx, yy, 8, 7); }
      for (let i = 0; i < 4; i++) { const tx = Math.floor(rnd() * (w - 40)); g.drawImage(PALM[i % 2], tx, GY - 52, 36, 52); }
      g.fillStyle = '#2f7a3f'; for (let i = 0; i < 20; i++) { const x = Math.floor(rnd() * w); disc(g, x, GY - 2, 4 + Math.floor(rnd() * 4), '#2f7a3f'); }
    },
  },
  end: {
    far(g, w, rnd) { ridge(g, w, 36, [[2, 12, 1], [4, 6, 0]], '#161a40'); g.fillStyle = C.gold; for (let i = 0; i < 12; i++) g.fillRect(Math.floor(rnd() * w), GY - 8 - Math.floor(rnd() * 16), 1, 1); },
    mid(g, w, rnd) { ridge(g, w, 18, [[3, 6, 0], [6, 3, 2]], '#0f1230'); g.fillStyle = '#0b0d26'; for (let i = 0; i < 12; i++) { const x = Math.floor(rnd() * w), h = 12 + rnd() * 16; wrapDraw(w, x, 12, (xx) => { for (let y = 0; y < h; y++) { const hw = Math.round((y / h) * 5); g.fillRect(xx + 6 - hw, GY - 14 - h + y, hw * 2 + 1, 1); } g.fillRect(xx + 5, GY - 14, 2, 8); }); } },
  },
};
const LAYER = {};
for (const k in PAINT) { const f = mk(FAR_W, H), m = mk(MID_W, H); PAINT[k].far(f.getContext('2d'), FAR_W, rng(k.length * 31 + 1)); PAINT[k].mid(m.getContext('2d'), MID_W, rng(k.length * 17 + 5)); LAYER[k] = { far: f, mid: m }; }

// ===================== ground tiles =====================
function makeGround(style) {
  const c = mk(16, H - GY), g = c.getContext('2d'), rnd = rng(style.length * 13 + 3);
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const speck = (a, b, n) => { for (let i = 0; i < n; i++) r(Math.floor(rnd() * 16), 5 + Math.floor(rnd() * 34), 1, 1, rnd() < 0.5 ? a : b); };
  switch (style) {
    case 'start': r(0, 0, 16, 40, '#5a3a28'); r(0, 0, 16, 4, C.green); r(0, 0, 16, 1, C.lime); r(3, 4, 2, 1, C.green); r(11, 4, 1, 1, C.green); speck('#7a4f35', '#3f281c', 10); break;
    case 'bit': r(0, 0, 16, 40, '#a39e92'); for (let y = 3; y < 40; y += 8) { r(0, y, 16, 1, '#8a8478'); r(((y - 3) / 8) % 2 ? 0 : 8, y, 1, 8, '#8a8478'); r(1, y + 1, 6, 1, '#b9b4a8'); r(9, y + 1, 6, 1, '#b9b4a8'); } r(0, 0, 16, 3, '#5fae4f'); r(0, 0, 16, 1, C.lime); break;
    case 'sim': for (let y = 0; y < 40; y += 8) for (let x = 0; x < 16; x += 8) r(x, y, 8, 8, ((x + y) / 8) % 2 ? '#2b3a67' : '#24315a'); for (let y = 0; y < 40; y += 8) r(0, y, 16, 1, '#33508a'); r(0, 0, 1, 40, '#33508a'); r(8, 0, 1, 40, '#33508a'); r(0, 0, 16, 1, '#6fa0e0'); break;
    case 'oak': r(0, 0, 16, 40, '#4a4652'); for (let y = 0; y < 3; y++) for (let x = 0; x < 16; x++) r(x, y, 1, 1, ((x + y) >> 2) & 1 ? C.gold : C.ink); r(0, 3, 16, 1, '#2b2833'); speck('#57525f', '#3e3a46', 12); r(15, 4, 1, 36, '#3a3642'); break;
    case 'air': r(0, 0, 16, 40, '#3b3f4e'); r(0, 0, 16, 1, '#5a6075'); r(4, 14, 8, 2, '#e8c84b'); speck('#444858', '#33364a', 10); break;
    case 'nus': r(0, 0, 16, 40, '#b0603c'); for (let y = 5; y < 40; y += 7) { r(0, y, 16, 1, '#8f4a2e'); r(((y - 5) / 7) % 2 ? 4 : 12, y, 1, 7, '#8f4a2e'); r(1, y + 1, 14, 1, '#c8734a'); } r(0, 0, 16, 5, '#3f9a4a'); r(0, 0, 16, 1, '#7fd16a'); r(2, 5, 2, 1, '#3f9a4a'); r(10, 5, 1, 1, '#3f9a4a'); break;
    default: r(0, 0, 16, 40, '#2a1f1c'); r(0, 0, 16, 4, '#24502c'); r(0, 0, 16, 1, '#3f7a45'); speck('#3a2a24', '#1f1614', 10);
  }
  return c;
}
const GROUND = {}; for (const k of ['start', 'bit', 'sim', 'oak', 'air', 'nus', 'end']) GROUND[k] = makeGround(k);

// ===================== characters & machines =====================
const G1 = { limb: '#6b7186', limbD: '#454a5c', body: '#7a8096', chest: '#a6acc0', head: '#2b2e3a', led: C.cyan, joint: '#2b2e3a', foot: '#2b2e3a' };
const TEACHER = { ...G1, chest: C.gold, led: C.gold, body: '#8a8a8a' };
const HUMAN = { limb: C.skin, limbD: C.skinD, legs: C.denim, legsD: C.denimD, body: '#3f6fb5', head: C.skin, hair: C.hair, joint: C.denimD, foot: C.white, human: true };
const STICK = { stick: true, col: C.pink };
const POSE0 = { hl: 0.05, kl: 0.1, hr: -0.05, kr: 0.1, sl: -0.1, el: 0.3, sr: 0.1, er: 0.3, lean: 0 };
function walkPose(ph, moving) {
  if (!moving) return POSE0; const s = Math.sin(ph), c = Math.cos(ph);
  return { hl: s * 0.45, kl: Math.max(0, -c) * 0.9 + 0.1, hr: -s * 0.45, kr: Math.max(0, c) * 0.9 + 0.1, sl: -s * 0.5, el: 0.5, sr: s * 0.5, er: 0.5, lean: 0.06 };
}
const DANCE = [
  { hl: 0.25, kl: 0.1, hr: -0.25, kr: 0.1, sl: 2.7, el: 0.2, sr: 2.5, er: 0.3, lean: 0 },
  { hl: 0.55, kl: 1.0, hr: -0.2, kr: 0.6, sl: 1.6, el: 0.0, sr: 1.4, er: 0.2, lean: 0.15 },
  { hl: 0.1, kl: 0.2, hr: 1.0, kr: 1.5, sl: 3.0, el: 0.1, sr: 0.6, er: 1.6, lean: -0.1 },
  { hl: 0.7, kl: 1.4, hr: 0.6, kr: 1.4, sl: 1.2, el: 0.8, sr: -0.6, er: 1.2, lean: 0.3 },
];
function lerpPose(a, b, k) { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key], k); return o; }
function dancePose(t) { const beat = t * 2; const i = ((Math.floor(beat) % 4) + 4) % 4, j = (i + 1) % 4; let k = beat - Math.floor(beat); k = k < 0.55 ? 0 : (k - 0.55) / 0.45; k = k * k * (3 - 2 * k); return lerpPose(DANCE[i], DANCE[j], k); }

function humanoid(sx, sy, p, f, pal, sc = 1) {
  const th = 6 * sc, sh = 6 * sc, ua = 5 * sc, fa = 5 * sc, tor = 9 * sc;
  const V = (a, l) => [Math.sin(a) * l * f, Math.cos(a) * l];
  const kL = V(p.hl, th), aL = add2(kL, V(p.hl - p.kl, sh)), kR = V(p.hr, th), aR = add2(kR, V(p.hr - p.kr, sh));
  const footH = Math.max(1, Math.round(2 * sc));
  const hx = sx, hy = sy - footH - Math.max(aL[1], aR[1]);
  const lean = p.lean || 0;
  const nk = [hx + Math.sin(lean) * tor * f, hy - Math.cos(lean) * tor];
  const sp = [nk[0] - Math.sin(lean) * 1.5 * sc * f, nk[1] + 1.5 * sc];
  const eL = add2(sp, V(p.sl, ua)), wL = add2(eL, V(p.sl + p.el, fa)), eR = add2(sp, V(p.sr, ua)), wR = add2(eR, V(p.sr + p.er, fa));
  const A = (q) => [hx + q[0], hy + q[1]];
  const KL = A(kL), AL = A(aL), KR = A(kR), AR = A(aR);
  const lw = Math.max(1, Math.round(3 * sc)), aw = Math.max(1, Math.round(2 * sc)), tw = Math.max(2, Math.round(5 * sc));
  if (pal.stick) {
    const c = pal.col; L(sp[0], sp[1], eL[0], eL[1], c); L(eL[0], eL[1], wL[0], wL[1], c); L(hx, hy, KL[0], KL[1], c); L(KL[0], KL[1], AL[0], AL[1], c);
    L(hx, hy, nk[0], nk[1], c); L(hx, hy, KR[0], KR[1], c); L(KR[0], KR[1], AR[0], AR[1], c); L(sp[0], sp[1], eR[0], eR[1], c); L(eR[0], eR[1], wR[0], wR[1], c);
    ring(nk[0], nk[1] - 3 * sc, 2.2 * sc, c); return { wL, wR };
  }
  const foot = (P, col) => R(P[0] - 1 - (f < 0 ? 2 * sc : 0), P[1], Math.max(2, 4 * sc), footH, col);
  L(sp[0], sp[1], eL[0], eL[1], pal.limbD, aw); L(eL[0], eL[1], wL[0], wL[1], pal.limbD, aw);
  L(hx, hy, KL[0], KL[1], pal.legsD || pal.limbD, lw); L(KL[0], KL[1], AL[0], AL[1], pal.legsD || pal.limbD, lw); foot(AL, pal.foot);
  L(hx, hy, nk[0], nk[1], pal.body, tw);
  if (pal.chest) L(lerp(hx, nk[0], 0.5) + f * sc, lerp(hy, nk[1], 0.5), lerp(hx, nk[0], 0.85) + f * sc, lerp(hy, nk[1], 0.85), pal.chest, Math.max(1, Math.round(2 * sc)));
  R(hx - 3 * sc, hy - 1, 6 * sc, Math.max(2, 3 * sc), pal.joint);
  const hh = Math.round(6 * sc), hcx = Math.round(nk[0]), hcy = Math.round(nk[1] - 7 * sc);
  if (pal.human) {
    R(hcx - 3, hcy, 6, 6, pal.head); R(hcx - 3, hcy - 1, 6, 3, pal.hair); R(hcx - 3 - (f > 0 ? 0 : -4), hcy + 2, 2, 3, pal.hair);
    R(hcx + (f > 0 ? 1 : -2), hcy + 3, 1, 1, C.ink); R(hcx - 3, hcy + 1, 6, 1, C.gray); R(hcx + (f > 0 ? 2 : -4), hcy, 2, 2, C.mag);
  } else {
    R(hcx - 3 * sc, hcy, hh, hh, pal.head); R(hcx - 3 * sc, hcy, 1, 1, 'rgba(0,0,0,0)');
    R(hcx - 3 * sc + (f > 0 ? Math.round(2 * sc) : 0), hcy + Math.round(2 * sc), Math.max(2, Math.round(4 * sc)), Math.max(1, Math.round(2 * sc)), pal.led);
  }
  L(hx, hy, KR[0], KR[1], pal.legs || pal.limb, lw); L(KR[0], KR[1], AR[0], AR[1], pal.legs || pal.limb, lw); foot(AR, pal.foot);
  L(sp[0], sp[1], eR[0], eR[1], pal.limb, aw); L(eR[0], eR[1], wR[0], wR[1], pal.limb, aw);
  return { wL, wR, head: [hcx, hcy] };
}

function ik2(l1, l2, dx, dy) {
  const d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.5); const a = Math.atan2(dy, dx);
  const b = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const e1 = [Math.cos(a + b) * l1, Math.sin(a + b) * l1], e2 = [Math.cos(a - b) * l1, Math.sin(a - b) * l1];
  const e = e1[1] < e2[1] ? e1 : e2; const k = d / Math.hypot(dx, dy || 0.0001);
  return { e, w: [dx * Math.min(1, k), dy * Math.min(1, k)] };
}
function fr3(bx, by, tx, ty) {
  R(bx - 4, by - 8, 9, 8, C.white); R(bx - 5, by - 1, 11, 1, C.lgray); R(bx - 4, by - 8, 1, 8, C.lgray);
  const s = [bx, by - 13]; L(bx, by - 8, s[0], s[1], C.white, 5);
  const k = ik2(26, 22, tx - s[0], ty - 7 - s[1]); const el = add2(s, k.e), wr = add2(s, k.w);
  L(s[0], s[1], el[0], el[1], C.white, 5); L(el[0], el[1], wr[0], wr[1], C.white, 4); L(wr[0], wr[1], wr[0], wr[1] + 6, C.lgray, 3);
  for (const j of [s, el, wr]) R(j[0] - 1, j[1] - 1, 3, 3, C.vdgray);
  L(wr[0] - 2, wr[1] + 6, wr[0] - 2, wr[1] + 9, C.vdgray); L(wr[0] + 2, wr[1] + 6, wr[0] + 2, wr[1] + 9, C.vdgray);
  return [wr[0], wr[1] + 9];
}
function hand(wx, wy, g, sc, col, outline) {
  const fing = [[-5, 0.55], [-2, 0.95], [1, 0.95], [4, 0.9]]; const segs = [7, 6, 4].map((v) => v * sc); const chains = [];
  for (const [ox, bend] of fing) { let p = [wx + ox * sc, wy - 12 * sc], a = -Math.PI / 2; const c = [p];
    for (let i = 0; i < 3; i++) { a += g * bend * (i === 0 ? 0.6 : 0.9); p = [p[0] + Math.cos(a) * segs[i], p[1] + Math.sin(a) * segs[i]]; c.push(p); } chains.push(c); }
  { let p = [wx + 6 * sc, wy - 5 * sc], a = -Math.PI / 4; const c = [p]; for (let i = 0; i < 2; i++) { a -= g * 0.7; p = [p[0] + Math.cos(a) * 5 * sc, p[1] + Math.sin(a) * 5 * sc]; c.push(p); } chains.push(c); }
  const seg = (c, cl, t) => { for (let i = 0; i < c.length - 1; i++) L(c[i][0], c[i][1], c[i + 1][0], c[i + 1][1], cl, t); };
  if (outline) {
    L(wx - 6 * sc, wy - 12 * sc, wx - 6 * sc, wy, col); L(wx + 6 * sc, wy - 12 * sc, wx + 6 * sc, wy, col); L(wx - 6 * sc, wy, wx + 6 * sc, wy, col); L(wx - 6 * sc, wy - 12 * sc, wx + 6 * sc, wy - 12 * sc, col);
    chains.forEach((c) => seg(c, col, 1));
  } else {
    R(wx - 7 * sc, wy - 13 * sc, 15 * sc, 14 * sc, C.ink); R(wx - 4, wy, 9, 7, C.ink); chains.forEach((c) => seg(c, C.ink, 4));
    R(wx - 6 * sc, wy - 12 * sc, 13 * sc, 12 * sc, col.body); R(wx - 6 * sc, wy - 12 * sc, 13 * sc, 1, col.hi); R(wx - 3, wy, 7, 6, col.body);
    chains.forEach((c) => seg(c, col.finger, 2)); chains.forEach((c) => c.slice(1).forEach((q) => R(q[0], q[1], 1, 1, col.joint)));
  }
  return chains.map((c) => c[c.length - 1]);
}
function drawPlane(x, y, gear) {
  const Lp = 140;
  for (let r = 0; r < 22; r++) R(x + 4 + Math.round(r * 0.55), y - 20 - r, 14 - Math.round(r * 0.4), 1, C.navy);
  R(x + 10, y - 20, Lp - 26, 18, C.white); R(x + 2, y - 18, 8, 13, C.white); R(x, y - 16, 2, 8, C.white);
  R(x + Lp - 16, y - 19, 8, 16, C.white); R(x + Lp - 8, y - 16, 5, 11, C.white); R(x + Lp - 3, y - 13, 2, 6, C.white);
  R(x + 10, y - 20, Lp - 26, 1, '#ffffff'); R(x + 4, y - 4, Lp - 10, 2, C.lgray);
  for (let wx = x + 26; wx < x + Lp - 24; wx += 6) R(wx, y - 15, 3, 3, '#3a4f6f');
  R(x + Lp - 12, y - 16, 6, 3, C.navy); R(x + 6, y - 9, Lp - 12, 2, C.mag); R(x + 6, y - 7, Lp - 14, 1, C.navy);
  R(x + Lp - 32, y - 18, 6, 13, C.lgray); R(x + Lp - 31, y - 17, 4, 11, C.white);
  for (let r = 0; r < 7; r++) R(x + 54 - r * 3, y - 5 + r, 42, 1, r % 3 ? C.lgray : C.gray);
  R(x + 62, y - 1, 20, 7, C.gray); R(x + 80, y, 2, 5, C.vdgray); R(x + 62, y - 1, 20, 1, C.lgray);
  if (gear) { R(x + 34, y - 2, 2, 8, C.vdgray); R(x + 31, y + 5, 8, 4, C.ink); R(x + Lp - 22, y - 2, 2, 8, C.vdgray); R(x + Lp - 24, y + 5, 6, 4, C.ink); }
}
function trophy(x, y, col) {
  const [b, d, h] = col;
  R(x, y, 8, 1, b); R(x + 1, y + 1, 6, 3, b); R(x + 2, y + 4, 4, 1, b); R(x + 3, y + 5, 2, 3, d); R(x + 1, y + 8, 6, 2, d); R(x + 1, y + 8, 6, 1, b);
  R(x - 1, y + 1, 1, 2, b); R(x + 8, y + 1, 1, 2, b); R(x + 2, y + 1, 1, 2, h);
  if (Math.floor(T * 1.3 + x) % 5 === 0) { R(x + 6, y - 3, 1, 3, '#ffffff'); R(x + 5, y - 2, 3, 1, '#ffffff'); }
}
const GOLD = ['#f2c84b', '#c99a2e', '#fff1a8'], SILVER = ['#d6dbe6', '#9aa3b5', '#ffffff'], BRONZE = ['#d08a4a', '#9a5a2a', '#f2c09a'];
function aprilTag(x, y, seed) {
  R(x, y, 8, 8, C.white); R(x + 1, y + 1, 6, 6, C.ink); const r = rng(seed);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (r() < 0.45) R(x + 2 + i, y + 2 + j, 1, 1, C.white);
}
function drawGem(x, y, k) {
  const [b, l, d] = GEMCOL[k];
  for (let r = -4; r <= 4; r++) { const hw = 4 - Math.abs(r); R(x - hw, y + r, hw * 2 + 1, 1, C.ink); }
  for (let r = -3; r <= 3; r++) { const hw = 3 - Math.abs(r); R(x - hw, y + r, hw * 2 + 1, 1, b); if (r < 0 && hw > 0) R(x - hw, y + r, hw, 1, l); if (r > 0) R(x, y + r, hw + 1, 1, d); }
  R(x - 1, y - 2, 1, 1, '#ffffff');
}

// ===================== monster & weapon sprites =====================
let CX = 0; // camera x rounded, set every render
const wName = (id) => (lang === 'zh' && WEAPONS[id].zh) || WEAPONS[id].n;
function cart(x, y, id) {
  const W = WEAPONS[id], w = W.code.length * 6 + 5, h = 11, x0 = Math.round(x - w / 2), y0 = Math.round(y - h / 2);
  R(x0 - 1, y0 - 1, w + 2, h + 2, C.ink); R(x0, y0, w, h, W.c); ctx.globalAlpha = 0.55; R(x0 + 1, y0 + 1, w - 2, 1, '#ffffff'); ctx.globalAlpha = 1;
  txt(W.code, x0 + w / 2, y0 + 2, C.ink, 1, 1); R(x0 + w - 3, y0 + h - 3, 2, 2, C.ink);
}
const mono = (c) => ({ limb: c, limbD: c, body: c, chest: c, head: c, led: c, joint: c, foot: c });
const GL_C = mono('#4fd6e0'), GL_R = mono('#d6443c');
const DANCER = { limb: '#e0457b', limbD: '#9a2a55', body: '#e0457b', chest: '#f7a3c0', head: C.ink, led: C.cyan, joint: '#9a2a55', foot: C.ink };
const MONLOOK = {
  ball(m, x, y) {
    const cx = x + 6, cy = y + 6, f = m.face > 0 ? 1 : 0; disc(ctx, cx, cy + 1, 6, '#9a5a2a'); disc(ctx, cx, cy, 6, C.orange); disc(ctx, cx - 2, cy - 2, 2, '#f7c08a');
    const a = m.x * 0.35; L(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, cx - Math.cos(a) * 5, cy - Math.sin(a) * 5, '#c9702a');
    R(x + 2, y + 4, 3, 3, C.white); R(x + 7, y + 4, 3, 3, C.white); R(x + 3 + f, y + 5, 1, 2, C.ink); R(x + 8 + f, y + 5, 1, 2, C.ink); R(x + 2, y + 3, 3, 1, C.ink); R(x + 7, y + 3, 3, 1, C.ink);
  },
  pin(m, x, y) {
    const fl = Math.floor(m.t * 8) % 2; R(x - 3, y + 3 + fl, 3, 2, C.white); R(x + 10, y + 3 + fl, 3, 2, C.white);
    disc(ctx, x + 5, y + 5, 5, C.red); for (let r = 0; r < 5; r++) R(x + 1 + r, y + 9 + r, 9 - r * 2, 1, C.red);
    disc(ctx, x + 5, y + 5, 2, C.white); R(x + 5 + (m.face > 0 ? 1 : -1), y + 5, 1, 1, C.ink); R(x + 3, y + 2, 2, 1, '#f07a6a');
  },
  car(m, x, y) {
    const sp = Math.floor(m.x / 3) % 2, f = m.face; R(x, y + 3, 16, 4, C.red); R(x + 4, y, 8, 3, '#f07a6a'); R(x + (f > 0 ? 8 : 5), y + 1, 3, 2, C.sky);
    R(x + 2, y + 7, 3, 3, C.ink); R(x + 11, y + 7, 3, 3, C.ink); R(x + 3 + sp, y + 8, 1, 1, C.gray); R(x + 12 - sp, y + 8, 1, 1, C.gray);
    const hx = f > 0 ? x + 14 : x; R(hx, y + 4, 2, 2, C.gold); R(hx - (f > 0 ? 1 : 0), y + 3, 3, 1, C.ink);
    R(x + 8, y - 3, 1, 3, C.gray); R(x + 8, y - 4, 1, 1, Math.floor(m.t * 4) % 2 ? C.cyan : C.blue);
  },
  gremlin(m, x, y) {
    x += m.tele > 0 ? Math.floor(m.t * 30) % 2 : 0; const ec = m.tele > 0 ? C.white : C.red;
    R(x, y + 2, 12, 10, C.vdgray); R(x, y + 2, 12, 1, C.dgray); R(x + 5, y - 1, 2, 3, C.gray); R(x + 5, y - 2, 2, 1, C.ok);
    R(x + 2, y + 5, 3, 2, ec); R(x + 7, y + 5, 3, 2, ec); R(x + 3, y + 9, 6, 1, C.gray); R(x + 3, y + 10, 1, 1, C.gray); R(x + 8, y + 10, 1, 1, C.gray);
  },
  heart(m, x, y) {
    disc(ctx, x + 3, y + 3, 3, C.pink); disc(ctx, x + 8, y + 3, 3, C.pink); for (let r = 0; r < 6; r++) R(x + r, y + 5 + r, 12 - r * 2, 1, C.pink); R(x + 2, y + 1, 2, 1, '#ffd0e4');
    R(x + 2, y + 4, 3, 1, C.ink); R(x + 7, y + 4, 3, 1, C.ink);
    const k = Math.floor(m.t * 6) % 8; for (let i = 0; i < 8; i++) R(x + 2 + i, y + 7 - (i === k ? 2 : i === k + 1 ? -1 : 0), 1, 1, C.white);
    txt('Z', x + 11, y - 6 - ((m.t * 5) % 6), '#f7c8e0');
  },
  golem(m, x, y) {
    const sw = m.onGround && Math.abs(m.vx) > 1 ? Math.floor(m.t * 6) % 2 : 0, f = m.face > 0 ? 1 : 0;
    R(x + 2, y + 18, 6, 6, '#2f4f88'); R(x + 12, y + 18, 6, 6, '#2f4f88'); R(x + 2, y + 18, 6, 1, '#5f8fd0'); R(x + 12, y + 18, 6, 1, '#5f8fd0');
    R(x, y + 8 + sw, 20, 11, '#3a5fa0'); R(x, y + 8 + sw, 20, 1, '#6fa0e0'); R(x + 10, y + 9 + sw, 1, 10, '#2f4f88'); R(x, y + 13 + sw, 20, 1, '#2f4f88');
    R(x + 5, y + sw, 10, 9, '#4a6fb0'); R(x + 5, y + sw, 10, 1, '#7fb0f0');
    const ec = DF().boss >= 2 && m.hp < m.maxHp / 2 ? C.red : C.cyan; R(x + 7 + f, y + 3 + sw, 2, 2, ec); R(x + 11 + f, y + 3 + sw, 2, 2, ec);
    R(x - 3, y + 9 + sw, 3, 9, '#2f4f88'); R(x + 20, y + 9 + sw, 3, 9, '#2f4f88');
    if (m.hp < m.maxHp / 2) { R(x + 3, y + 10 + sw, 1, 3, C.ink); R(x + 4, y + 12 + sw, 2, 1, C.ink); R(x + 15, y + 15 + sw, 2, 1, C.ink); }
  },
  crawler(m, x, y) {
    const ph = Math.floor(m.t * 10) % 2; R(x + 2, y + 1, 12, 6, '#6b5a4a'); R(x + 4, y, 3, 1, '#8a7a62'); R(x + 9, y, 3, 1, '#8a7a62'); R(x + 3, y + 1, 10, 1, '#8a7a62');
    for (let i = 0; i < 3; i++) R(x + 3 + i * 4 + (ph ^ (i % 2)), y + 7, 1, 2, C.ink);
    const ex = m.face > 0 ? x + 13 : x + 2; R(ex, y + 3, 1, 1, C.gold); R(ex + (m.face > 0 ? 1 : -1), y + 2, 1, 1, C.ink);
  },
  dancer(m, x, y) {
    const p = dancePose(m.t * 1.3), j = () => (Math.random() - 0.5) * 0.5; const pp = { ...p, sl: p.sl + j(), sr: p.sr + j(), lean: p.lean + j() * 0.3 };
    ctx.globalAlpha = 0.55; humanoid(x + 5, y + m.h, pp, m.face, GL_C, 0.75); humanoid(x + 7, y + m.h, pp, m.face, GL_R, 0.75); ctx.globalAlpha = 1;
    humanoid(x + 6, y + m.h, pp, m.face, DANCER, 0.75);
  },
  spike(m, x, y) {
    const pts = []; for (let i = 0; i <= 6; i++) pts.push([x + i * 2.6, y + (i % 2 ? 1 : 8) + (Math.random() < 0.3 ? Math.round(Math.random() * 2 - 1) : 0)]);
    ctx.globalAlpha = 0.35; for (let i = 0; i < 6; i++) L(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, C.orange, 3); ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) L(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], C.red, 2);
    const f = m.face > 0 ? 1 : 0; R(x + 6, y + 3, 2, 2, C.white); R(x + 9, y + 3, 2, 2, C.white); R(x + 6 + f, y + 4, 1, 1, C.ink); R(x + 9 + f, y + 4, 1, 1, C.ink);
  },
  mimic(m, x, y) {
    R(x, y + 3, 16, 11, '#c8945a'); R(x, y + 3, 1, 11, C.wood); R(x + 15, y + 3, 1, 11, C.wood);
    if (m.state === 'charge') { R(x - 1, y - 2, 18, 3, '#b07a44'); for (let i = 0; i < 5; i++) R(x + 1 + i * 3, y + 3, 2, 2, C.white); } else R(x - 1, y + 1, 18, 3, '#b07a44');
    aprilTag(x + 4, y + 6, 11);
  },
  cup(m, x, y) {
    const s = Math.round(Math.sin(m.t * 6)); ctx.globalAlpha = 0.5; R(x + 3 + s, y + 11, 6, 2, C.white); R(x + 4 - s, y + 13, 4, 1, C.white); ctx.globalAlpha = 1;
    R(x + 2, y + 3, 8, 8, C.white); R(x + 1, y + 2, 10, 1, '#ffffff'); R(x + 10, y + 5, 2, 1, C.white); R(x + 11, y + 6, 1, 2, C.white); R(x + 10, y + 8, 2, 1, C.white);
    R(x + 4, y + 5, 1, 2, C.ink); R(x + 7, y + 5, 1, 2, C.ink);
    const a = m.t * 2, ox = x + 6, oy = y + 7; L(ox, oy, ox + Math.cos(a) * 8, oy + Math.sin(a) * 3, C.red); L(ox, oy, ox, oy - 9, C.ok); L(ox, oy, ox - Math.cos(a) * 3, oy + 6, C.blue);
  },
  ghosthand(m, x, y) {
    ctx.globalAlpha = 0.85; hand(x + 7, y + 15, 0.35 + Math.sin(m.t * 6) * 0.25, 0.62, { body: '#f7a3c0', hi: '#ffffff', finger: C.pink, joint: '#9a2a55' }, false); ctx.globalAlpha = 1;
    R(x + 5, y + 9, 1, 2, C.ink); R(x + 9, y + 9, 1, 2, C.ink);
  },
  arm(m, x, y) {
    R(x + 2, y + 14, 10, 6, C.dgray); R(x + 2, y + 14, 10, 1, C.gray); const bx = x + 7, by = y + 14;
    const ex = bx + Math.sin(m.t) * 1.5, ey = by - 8, ang = Math.atan2(P.y + 11 - ey, P.x + 5 - CX - ex), nx = ex + Math.cos(ang) * 8, ny = ey + Math.sin(ang) * 8;
    L(bx, by, ex, ey, C.white, 3); L(ex, ey, nx, ny, C.white, 3); R(bx - 1, by - 1, 3, 3, C.vdgray); R(ex - 1, ey - 1, 3, 3, C.vdgray); R(nx - 1, ny - 1, 3, 3, m.tele > 0 ? C.gold : C.red);
  },
  bug(m, x, y) {
    const ph = Math.floor(m.t * 12) % 2, f = m.face; R(x + 1, y + 1, 8, 5, '#2f3a2a'); R(x + 2, y + 1, 6, 1, '#5f7a4a'); R(x + 5, y + 1, 1, 5, '#1b2218');
    R(f > 0 ? x + 8 : x + 1, y + 2, 1, 1, C.red); R(f > 0 ? x + 9 : x, y, 1, 1, C.ink); for (let i = 0; i < 3; i++) R(x + 2 + i * 3 + ph, y + 6, 1, 1, C.ink);
  },
};
function drawProjGem(x, y) {
  const c = ['#fff1a8', '#f2c84b', '#ffffff'][Math.floor(T * 6) % 3];
  for (let r = -6; r <= 6; r++) { const hw = Math.round((6 - Math.abs(r)) * 0.8); R(x - hw - 1, y + r, hw * 2 + 3, 1, C.ink); }
  for (let r = -5; r <= 5; r++) { const hw = Math.round((5 - Math.abs(r)) * 0.8); R(x - hw, y + r, hw * 2 + 1, 1, r < 0 ? c : C.gold); }
  R(x - 1, y - 2, 3, 4, C.white); R(x - 1, y - 1, 2, 1, C.gray); R(x - 1, y + 1, 2, 1, C.gray);
  ctx.globalAlpha = 0.4 + 0.3 * Math.sin(T * 5); ring(x, y, 8 + Math.sin(T * 5), C.gold); ctx.globalAlpha = 1;
}
function drawCoffee(x, y) {
  R(x, y + 2, 6, 6, C.white); R(x, y + 2, 6, 1, C.brown); R(x + 6, y + 3, 1, 3, C.white); R(x + 1, y + 7, 4, 1, C.lgray);
  if (Math.floor(T * 3) % 2) R(x + 2, y - 1, 1, 2, C.lgray); else R(x + 3, y - 1, 1, 2, C.lgray);
}

// ===================== world =====================
const SOLIDS = [], THINGS = [], PITS = [], MOVERS = [];
const solid = (x, y, w, h, kind, o) => { const s = { x, y, w, h, kind, ...(o || {}) }; SOLIDS.push(s); return s; };
const ledge = (x, y, w, look) => solid(x, y, w, 4, 'ledge', { oneway: true, look });
const mover = (bx, by, w, ax, ay, sp, ph, look) => { const s = solid(bx, by, w, 6, 'mover', { oneway: true, move: true, bx, by, ax, ay, sp, ph, dx: 0, dy: 0, look }); MOVERS.push(s); return s; };
const add = (o) => { o.z = o.z || 0; THINGS.push(o); return o; };
let SC_K = 0; // scoreboard bar animation 0..1
const S = { read: new Set(), gems: new Set(), ach: new Set(), weapons: new Set(), killed: new Set(), wpn: null, time: 0, flag: 0, flagK: 0, cp: 40, diff: 'normal', best: {} };
const DF = () => DIFF[S.diff] || DIFF.normal;
const solved = (id) => S.killed.has(id);
function overPit(e) { for (const p of PITS) if (e.x + 3 >= p.x0 && e.x + e.w - 3 <= p.x1) return p; return null; }
function groundAt(x0, x1 = x0 + 1) { let y = GY; for (const s of SOLIDS) if (s.kind !== 'wall' && !s.move && x1 > s.x && x0 < s.x + s.w && s.y < y) y = s.y; return y; }
function patrol(o, dt) {
  if (o.wait > 0) { o.wait -= dt; o.moving = false; return; }
  o.face = o.dir; o.x += o.dir * o.spd * dt; o.moving = true; o.ph += dt * o.spd * 0.28;
  if (o.x > o.max) { o.x = o.max; o.dir = -1; o.wait = 0.9; } if (o.x < o.min) { o.x = o.min; o.dir = 1; o.wait = 0.9; }
}
const bot = (x, min, max, spd) => ({ x, min, max, spd, dir: 1, face: 1, wait: 0, ph: 0, moving: false });
const TB = bot(2150, 2140, 2200, 16), SB = { x: 2102, face: 1, ph: 0, moving: false };
const LB = bot(3060, 3050, 3220, 20), CB = bot(3810, 3800, 3840, 14);
let chestThing = null;

function buildWorld() {
  SOLIDS.length = 0; THINGS.length = 0; PITS.length = 0; MOVERS.length = 0;
  solid(-20, -400, 20, 800, 'wall'); solid(WORLD_W, -400, 20, 800, 'wall'); solid(GAP0 - 8, -400, 8, 800, 'wall'); solid(GAP1 - 8, -400, 8, 800, 'wall');
  PITS.push({ x0: 1136, x1: 1184, k: 'water', lily: true }, { x0: 2288, x1: 2336, k: 'void', label: 'NAN' }, { x0: 2624, x1: 2704, k: 'void', label: 'OUT OF BOUNDS' }, { x0: 5040, x1: 5120, k: 'water' });
  // ---------- prologue ----------
  add({ x: 70, y: GY - 86, w: 150, h: 86, draw(sx) {
    const y = GY - 86; R(sx + 22, y + 50, 4, 36, C.dgray); R(sx + 124, y + 50, 4, 36, C.dgray); R(sx + 22, y + 50, 1, 36, C.gray); R(sx + 124, y + 50, 1, 36, C.gray);
    R(sx - 2, y - 2, 154, 56, C.ink); R(sx, y, 150, 52, '#1d2142'); const ph = Math.floor(T * 5);
    for (let i = 0; i < 25; i++) { R(sx + 2 + i * 6, y + 2, 2, 2, (i + ph) % 3 === 0 ? C.gold : '#5a4a24'); R(sx + 2 + i * 6, y + 48, 2, 2, (i + ph + 1) % 3 === 0 ? C.gold : '#5a4a24'); }
    txtS('HAODONG ZOU', sx + 75, y + 12, C.white, 2, 1); txt('EMBODIED AI QUEST', sx + 75, y + 34, C.mag, 1, 1); } });
  add({ x: 250, y: GY - 28, w: 18, h: 28, entry: 'intro', tag: { zh: 'README · 档案', en: 'README' }, draw(sx) {
    const y = GY - 28; R(sx + 3, y + 14, 12, 14, C.dgray); R(sx, y, 18, 16, C.ink); R(sx + 1, y + 1, 16, 14, C.vdgray); R(sx + 3, y + 3, 12, 9, '#0e2a33');
    for (let i = 0; i < 3; i++) R(sx + 4, y + 4 + i * 2, 3 + ((i * 3 + Math.floor(T * 2)) % 6), 1, C.cyan); if (Math.floor(T * 2) % 2) R(sx + 12, y + 9, 2, 2, C.cyan); R(sx + 5, y + 20, 8, 2, C.gray); } });
  add({ x: 512, y: GY - 32, w: 40, h: 32, draw(sx) { R(sx + 18, GY - 24, 3, 24, C.brown); R(sx, GY - 32, 40, 11, C.wood); R(sx, GY - 32, 40, 1, C.tan); R(sx, GY - 22, 40, 1, '#6b4a2a'); txt('BIT →', sx + 20, GY - 30, C.ink, 1, 1); } });
  // ---------- BIT ----------
  for (const [x, i] of [[735, 0], [1060, 1], [1880, 2]]) add({ x, y: GY - 56, w: 40, h: 56, draw(sx) { ctx.drawImage(GINKGO[i], sx, GY - 56); } });
  add({ x: 600, y: GY - 96, w: 120, h: 96, entry: 'bit', tag: { zh: '北京理工大学', en: 'Beijing Institute of Technology' }, draw(sx) {
    const top = GY - 92;
    for (const px of [sx, sx + 106]) { R(px, top + 14, 14, 78, '#c9c2b0'); R(px, top + 14, 2, 78, '#e4ddca'); R(px + 12, top + 14, 2, 78, '#a39a84'); for (let yy = top + 24; yy < GY; yy += 10) R(px, yy, 14, 1, '#b3aa94'); R(px - 2, GY - 6, 18, 6, '#a39a84'); }
    R(sx - 8, top - 4, 136, 4, '#3b3f4e'); R(sx - 6, top, 132, 16, '#8a2f2a'); R(sx - 6, top, 132, 2, '#b5443a'); R(sx - 6, top + 14, 132, 2, '#5f1f1c');
    txtS('BIT', sx + 60, top + 1, C.gold, 2, 1); } });
  const bench = solid(790, GY - 10, 32, 10, 'bench');
  add({ x: bench.x, y: GY - 18, w: 32, h: 18, draw(sx) { R(sx, GY - 18, 32, 2, C.wood); R(sx + 2, GY - 18, 2, 8, C.vdgray); R(sx + 28, GY - 18, 2, 8, C.vdgray); R(sx, GY - 10, 32, 3, C.wood); R(sx, GY - 10, 32, 1, C.tan); R(sx + 2, GY - 7, 2, 7, C.vdgray); R(sx + 28, GY - 7, 2, 7, C.vdgray); } });
  const pedestal = (sx, w) => { R(sx, GY - 16, w, 16, '#6b4a34'); R(sx - 1, GY - 17, w + 2, 2, '#8a6244'); R(sx + w / 2 - 5, GY - 11, 10, 4, C.goldD); };
  add({ x: 870, y: GY - 30, w: 30, h: 30, entry: 'honor_physics', tag: { zh: '物理竞赛奖杯', en: 'Physics trophies' }, draw(sx) { pedestal(sx, 30); trophy(sx + 5, GY - 28, GOLD); trophy(sx + 17, GY - 28, BRONZE); } });
  chestThing = add({ x: 950, y: GY - 16, w: 18, h: 16, entry: 'scholar', tag: { zh: '奖学金宝箱', en: 'Scholarship chest' }, draw(sx) {
    const y = GY - 12, open = S.read.has('scholar'); R(sx, y, 18, 12, C.wood); R(sx, y, 18, 1, '#c08a52'); R(sx, y + 5, 18, 1, '#6b4a2a'); R(sx + 4, y, 2, 12, C.goldD); R(sx + 12, y, 2, 12, C.goldD);
    if (open) { R(sx - 1, y - 9, 20, 3, '#8a5a32'); R(sx - 1, y - 9, 20, 1, '#c08a52'); R(sx, y - 6, 18, 1, '#5a3a20'); R(sx + 3, y - 1, 3, 2, C.gold); R(sx + 8, y - 2, 3, 2, C.gold); R(sx + 12, y - 1, 3, 2, C.gold); }
    else { R(sx - 1, y - 4, 20, 5, '#8a5a32'); R(sx - 1, y - 4, 20, 1, '#c08a52'); R(sx + 8, y - 1, 2, 3, C.gold); } } });
  add({ x: 1010, y: GY - 30, w: 22, h: 30, entry: 'honor_cup', tag: { zh: '“世纪杯”奖杯', en: 'Century Cup trophy' }, draw(sx) { pedestal(sx, 22); trophy(sx + 7, GY - 28, SILVER); } });
  solid(1216, GY - 10, 16, 10, 'stone'); solid(1232, GY - 20, 128, 20, 'stone'); solid(1360, GY - 10, 16, 10, 'stone');
  add({ x: 1420, y: GY - 68, w: 150, h: 68, draw(sx) {
    const y = GY - 64; R(sx, y, 150, 64, '#9a5a44'); for (let r = 0; r < 16; r++) { const yy = y + r * 4; R(sx, yy, 150, 1, '#7a4434'); for (let c = (r % 2) * 6; c < 150; c += 12) R(sx + c, yy, 1, 4, '#7a4434'); }
    R(sx - 4, y - 4, 158, 5, '#3b3f4e'); R(sx + 116, y + 20, 26, 44, '#2b2030'); R(sx + 116, y + 20, 26, 2, '#5a3a2a');
    R(sx + 10, y + 14, 30, 20, '#2b2030'); R(sx + 12, y + 16, 26, 16, '#f2d08a'); R(sx + 24, y + 16, 1, 16, '#2b2030'); R(sx + 12, y + 23, 26, 1, '#2b2030');
    R(sx + 52, y + 6, 54, 11, C.ink); txt('WORKSHOP', sx + 79, y + 8, C.gold, 1, 1); } });
  add({ x: 1450, y: GY - 26, w: 80, h: 26, draw(sx) {
    const y = GY - 20; R(sx, y, 80, 4, C.wood); R(sx, y, 80, 1, '#c08a52'); R(sx + 3, y + 4, 3, 16, '#6b4a2a'); R(sx + 74, y + 4, 3, 16, '#6b4a2a'); R(sx + 6, y + 11, 68, 2, '#6b4a2a');
    const a = Math.sin(T * 1.7), pc = sx + 20, py = y - 7, dy = Math.round(a * 2); R(pc, py, 1, 7, C.gray); L(pc - 8, py + dy, pc + 8, py - dy, C.lgray);
    const bx = pc + Math.sin(T * 1.7 - 1.2) * 6; R(bx - 1, py - 2 - dy * ((bx - pc) / 8), 2, 2, C.orange);
    R(sx + 40, y - 3, 9, 3, '#2f7a3f'); R(sx + 42, y - 4, 2, 1, C.vdgray); R(sx + 47, y - 3, 1, 1, Math.floor(T * 3) % 2 ? C.red : '#5a1a1a');
    R(sx + 58, y - 13, 15, 11, C.vdgray); R(sx + 59, y - 12, 13, 8, '#0e1f1a'); R(sx + 56, y - 2, 19, 2, C.gray);
    for (let i = 0; i < 13; i++) { const k = Math.floor(i + T * 8) % 13; const v = k === 6 ? 3 : k === 7 ? -2 : k === 5 ? 1 : 0; R(sx + 59 + i, y - 8 - v, 1, 1, C.ok); } } });
  solid(1600, GY - 16, 16, 16, 'crate'); solid(1616, GY - 32, 16, 32, 'crate');
  add({ x: 1700, y: GY - 42, w: 44, h: 42, entry: 'activities', tag: { zh: '公告栏', en: 'Notice board' }, draw(sx) {
    R(sx + 4, GY - 40, 3, 40, C.brown); R(sx + 37, GY - 40, 3, 40, C.brown); R(sx, GY - 42, 44, 28, '#6b4a2a'); R(sx + 2, GY - 40, 40, 24, '#c08a5a');
    for (const [nx, ny, w, h, c] of [[2, 2, 10, 9, C.white], [14, 4, 9, 7, C.gold], [25, 2, 12, 9, C.pink], [4, 13, 12, 8, C.sky], [19, 13, 8, 8, C.white], [29, 13, 9, 8, C.lime]]) {
      R(sx + 2 + nx, GY - 40 + ny, w, h, c); R(sx + 4 + nx, GY - 37 + ny, w - 4, 1, C.gray); if (h > 7) R(sx + 4 + nx, GY - 35 + ny, w - 5, 1, C.gray); R(sx + 1 + nx + w / 2, GY - 40 + ny, 2, 1, C.red); } } });
  add({ x: 1960, y: GY - 56, w: 24, h: 56, draw(sx) {
    R(sx, GY - 44, 24, 44, '#0e1426'); R(sx, GY - 44, 24, 2, C.cyan); R(sx, GY - 44, 2, 44, C.cyan); R(sx + 22, GY - 44, 2, 44, C.cyan);
    for (let i = 0; i < 10; i++) R(sx + 4 + (i * 7) % 16, GY - 42 + ((i * 13 + T * 30) % 40), 1, 2, i % 2 ? C.cyan : C.blue); txtS('SIM', sx + 12, GY - 54, C.cyan, 1, 1); } });
  // ---------- thesis / simulation ----------
  add({ x: 2024, y: GY - 76, w: 62, h: 16, draw(sx) { const y = GY - 74 + Math.round(Math.sin(T * 2)); ctx.globalAlpha = 0.2; R(sx, y, 62, 13, C.cyan); ctx.globalAlpha = 1; R(sx, y, 62, 1, C.cyan); R(sx, y + 12, 62, 1, C.cyan); txt('ISAAC GYM', sx + 31, y + 3, C.cyan, 1, 1); } });
  add({ x: 0, y: GY - 34, w: 16, h: 34, z: 1, bot: TB, draw() {
    const tx = Math.round(TB.x - CX), sx = Math.round(SB.x - CX);
    const hs = humanoid(sx, GY, walkPose(SB.ph, SB.moving), SB.face, G1), ht = humanoid(tx, GY, walkPose(TB.ph, TB.moving), TB.face, TEACHER);
    for (let i = 0; i < 4; i++) if ((Math.floor(T * 4) + i) % 2) R(tx + TB.face * (10 + i * 5), GY - 2, 1, 1, C.gold);
    dots(hs.head[0] + 3, hs.head[1] - 4, ht.head[0] + 3, ht.head[1] - 4, C.blue, 3);
    txtS('TEACHER', tx, GY - 44, C.gold, 1, 1); txtS('STUDENT', sx, GY - 54, C.cyan, 1, 1); } });
  ledge(2208, GY - 22, 26, 'sim'); ledge(2240, GY - 42, 26, 'sim'); ledge(2272, GY - 62, 26, 'sim');
  for (let i = 0; i < 5; i++) solid(2352 + i * 20, GY - (i + 1) * 10, 240 - i * 40, 10, 'pyr');
  mover(2650, GY, 28, 24, 0, 1.1, 0, 'sim');
  add({ x: 2716, y: GY - 64, w: 80, h: 64, draw(sx) {
    R(sx + 38, GY - 14, 4, 14, C.dgray); R(sx, GY - 62, 80, 48, C.ink); R(sx + 2, GY - 60, 76, 44, '#0e1426'); txt('TRAVERSAL', sx + 40, GY - 57, C.cyan, 1, 1);
    const k = SC_K * SC_K * (3 - 2 * SC_K); txt('BEFORE 46.7%', sx + 4, GY - 47, C.lgray); R(sx + 4, GY - 39, 72, 4, '#1b2440'); R(sx + 4, GY - 39, Math.round(72 * 0.467 * k), 4, C.gray);
    txt(solved('m_golem') ? 'AFTER  68.3%' : 'AFTER  ??.?%', sx + 4, GY - 31, solved('m_golem') ? C.cyan : C.red); R(sx + 4, GY - 23, 72, 4, '#1b2440'); R(sx + 4, GY - 23, Math.round(72 * 0.683 * k), 4, C.cyan); } });
  // ---------- OakCreek ----------
  add({ x: 2830, y: GY - 52, w: 74, h: 52, entry: 'oak', tag: { zh: '橡树清溪科技', en: 'OakCreek Tech' }, draw(sx) {
    R(sx + 8, GY - 20, 3, 20, C.dgray); R(sx + 63, GY - 20, 3, 20, C.dgray); R(sx, GY - 50, 74, 32, '#24202c'); R(sx + 1, GY - 49, 72, 30, '#2f2a3a');
    R(sx + 8, GY - 32, 3, 9, C.brown); disc(ctx, sx + 9, GY - 38, 6, C.gDark); disc(ctx, sx + 8, GY - 39, 4, C.green); R(sx + 6, GY - 41, 2, 1, C.lime);
    txt('OAKCREEK', sx + 20, GY - 44, C.white); txt('TECH', sx + 20, GY - 34, C.gold); txt('BEIJING', sx + 20, GY - 26, C.gray); } });
  let bx = 3040; for (const [w, h] of [[16, 3], [14, 5], [18, 4], [12, 6], [20, 2], [16, 5], [14, 3], [18, 6], [16, 4]]) { solid(bx, GY - h, w, h, 'bump'); bx += w + 6; }
  add({ x: 0, y: GY - 34, w: 16, h: 34, z: 1, bot: LB, draw() {
    const x = Math.round(LB.x - CX), gy = groundAt(LB.x - 2, LB.x + 2), f = LB.face;
    for (let i = 1; i <= 3; i++) { const px = LB.x + f * i * 16; R(px - CX, groundAt(px - 1, px + 1) - 2, 2, 2, C.ok); }
    dots(x, gy - 12, x + f * 48, groundAt(LB.x + f * 48 - 1, LB.x + f * 48 + 1) - 2, C.ok, 3);
    humanoid(x, gy, walkPose(LB.ph, LB.moving), f, G1);
    const ay = gy - 38; L(x - 7 * f, ay, x + 7 * f, ay, C.cyan); L(x + 7 * f, ay, x + 4 * f, ay - 3, C.cyan); L(x + 7 * f, ay, x + 4 * f, ay + 3, C.cyan); } });
  solid(3264, GY - 6, 80, 6, 'belt', { speed: -36 });
  add({ x: 3425, y: GY - 70, w: 64, h: 46, draw(sx) {
    R(sx, GY - 70, 64, 44, C.ink); R(sx + 2, GY - 68, 60, 40, '#1f1530'); txt('VIDEO', sx + 5, GY - 66, C.pink); if (Math.floor(T * 2) % 2) R(sx + 56, GY - 66, 3, 3, C.red);
    humanoid(sx + 32, GY - 30, dancePose(T), -1, STICK, 0.85); R(sx + 30, GY - 26, 4, 2, C.vdgray); } });
  solid(3380, GY - 12, 150, 12, 'stage');
  add({ x: 3392, y: GY - 42, w: 16, h: 30, z: 1, draw(sx) {
    const ok = solved('m_dance'), j = (Math.random() - 0.5) * 0.7;
    humanoid(sx + 8, GY - 12, ok ? dancePose(T - 0.25) : { ...POSE0, sl: POSE0.sl + j, sr: POSE0.sr - j, lean: j * 0.2 }, 1, G1); txtS('G1', sx + 8, GY - 52, ok ? C.cyan : C.red, 1, 1);
    if (!ok) return; ctx.globalAlpha = 0.1;
    for (const [x0, x1] of [[sx - 40, sx + 8], [sx + 100, sx + 8]]) for (let y = 0; y < GY - 12; y += 2) { const k = y / (GY - 12), w = 4 + k * 30; R(lerp(x0, x1, k) - w / 2, y, w, 2, '#fff3d0'); }
    ctx.globalAlpha = 1; } });
  solid(3560, GY - 6, 14, 6, 'spring', { sq: 0 }); ledge(3584, GY - 80, 52, 'steel');
  add({ x: 3660, y: GY - 64, w: 80, h: 64, draw(sx) {
    const ok = solved('m_spike'); R(sx, GY - 18, 80, 3, '#5a4a3a'); R(sx + 3, GY - 15, 3, 15, '#3a2f26'); R(sx + 74, GY - 15, 3, 15, '#3a2f26'); R(sx + 38, GY - 22, 4, 4, C.dgray);
    R(sx + 8, GY - 64, 64, 42, C.ink); R(sx + 10, GY - 62, 60, 38, '#101a2e'); txt('KEYFRAMES', sx + 12, GY - 60, C.gray);
    for (let i = 0; i < 6; i++) { const kx = sx + 14 + i * 10; R(kx, GY - 50, 1, 1, C.gold); R(kx - 1, GY - 49, 3, 1, C.gold); R(kx, GY - 48, 1, 1, C.gold); }
    const cur = 10 + ((T * 18) % 60);
    for (let i = 0; i < 60; i++) { const base = Math.sin(i * 0.17 + 1) * 6, spike = (i * 37) % 11 > 8 ? ((i % 2) ? 6 : -6) : ((i * 13) % 5) - 2, clean = ok && i + 10 < cur;
      R(sx + 10 + i, GY - 36 + Math.round(clean ? base : base + spike), 1, 1, clean ? C.ok : C.red); }
    if (ok) R(sx + cur, GY - 62, 1, 38, C.mag); } });
  add({ x: 0, y: GY - 34, w: 16, h: 34, z: 1, bot: CB, draw() {
    const x = Math.round(CB.x - CX), f = CB.face, p = { ...walkPose(CB.ph, CB.moving), sl: 1.3, el: 0.35, sr: 1.3, er: 0.35 };
    const h = humanoid(x, GY, p, f, G1), hx = Math.round(h.wR[0]), hy = Math.round(h.wR[1]);
    R(hx - (f > 0 ? 2 : 9), hy - 7, 11, 9, '#c8945a'); R(hx - (f > 0 ? 2 : 9), hy - 7, 11, 1, '#e0b07a'); aprilTag(hx - (f > 0 ? 0 : 7), hy - 6, 9); } });
  let si = 1; for (const [x, w, h] of [[3960, 20, 14], [3980, 24, 26], [4004, 30, 40]]) solid(x, GY - h, w, h, 'box', { seed: si++ });
  add({ x: 4140, y: GY - 32, w: 64, h: 32, draw(sx) { R(sx + 30, GY - 24, 3, 24, C.dgray); R(sx, GY - 34, 64, 11, C.gDark); R(sx, GY - 34, 64, 1, C.lime); txt('AIRPORT →', sx + 32, GY - 32, C.white, 1, 1); } });
  // ---------- airport ----------
  add({ x: 4216, y: GY - 58, w: 64, h: 58, draw(sx) { R(sx + 30, GY - 24, 4, 24, C.dgray); R(sx, GY - 58, 64, 34, C.ink); R(sx + 2, GY - 56, 60, 30, '#141a2e');
    txt('BJS → SIN', sx + 32, GY - 53, C.gold, 1, 1); txt('2026.08', sx + 32, GY - 43, C.white, 1, 1); if (Math.floor(T * 2) % 2) txt('BOARDING', sx + 32, GY - 33, C.ok, 1, 1); } });
  add({ x: 4290, y: GY - 52, w: 140, h: 52, draw(sx) { drawPlane(sx, GY - 9, true); } });
  add({ x: 4388, y: GY - 34, w: 30, h: 34, z: 1, action: 'fly', tag: { zh: '登机 · 飞往新加坡', en: 'Board · fly to Singapore' }, draw(sx) {
    for (let i = 0; i < 6; i++) R(sx + 2 + i * 4, GY - 4 - i * 4, 6, 2, C.lgray); L(sx + 2, GY - 6, sx + 24, GY - 28, C.gray); R(sx, GY - 4, 12, 4, C.dgray); R(sx + 1, GY - 1, 3, 1, C.ink); R(sx + 8, GY - 1, 3, 1, C.ink); } });
  // ---------- NUS ----------
  add({ x: 4668, y: GY - 74, w: 76, h: 74, action: 'flyback', tag: { zh: '飞回北京', en: 'Fly back to Beijing' }, draw(sx) {
    R(sx, GY - 62, 60, 62, '#3a4f6f'); R(sx, GY - 62, 60, 2, '#5a7090'); R(sx + 10, GY - 36, 30, 36, '#8fcfe0'); R(sx + 24, GY - 36, 2, 36, '#3a4f6f'); R(sx + 10, GY - 36, 30, 2, '#5a7090');
    R(sx, GY - 74, 76, 11, C.ink); txt('SIN ARRIVALS', sx + 38, GY - 72, C.gold, 1, 1); } });
  for (const [x, i] of [[4750, 0], [5980, 1], [6100, 0]]) add({ x, y: GY - 70, w: 48, h: 70, draw(sx) { ctx.drawImage(PALM[i], sx, GY - 70); } });
  add({ x: 4800, y: GY - 24, w: 60, h: 24, entry: 'nus', tag: { zh: '新加坡国立大学', en: 'National University of Singapore' }, draw(sx) {
    R(sx, GY - 22, 60, 22, '#e8e4dc'); R(sx, GY - 22, 60, 2, '#fffaf0'); R(sx, GY - 2, 60, 2, '#c9c2b0'); txt('NUS', sx + 30, GY - 19, C.nusB, 2, 1); R(sx + 8, GY - 4, 44, 2, C.nusO); } });
  add({ x: 4880, y: GY - 88, w: 120, h: 88, entry: 'nus_lab', tag: { zh: 'LV Robotics Lab & G&M Lab', en: 'LV Robotics Lab & G&M Lab' }, draw(sx) {
    R(sx, GY - 84, 120, 84, '#ece8df'); R(sx, GY - 84, 120, 4, C.nusO); R(sx - 2, GY - 88, 124, 4, '#c9c2b0');
    for (let c = 0; c < 5; c++) for (let r = 0; r < 2; r++) { R(sx + 6 + c * 22, GY - 76 + r * 18, 18, 14, '#5f8fc4'); R(sx + 7 + c * 22, GY - 75 + r * 18, 3, 1, '#a9cdee'); }
    R(sx + 10, GY - 40, 100, 10, C.nusB); txt('LV ROBOTICS LAB', sx + 60, GY - 38, C.white, 1, 1);
    R(sx + 50, GY - 28, 20, 28, C.navy); R(sx + 52, GY - 26, 7, 26, C.sky); R(sx + 61, GY - 26, 7, 26, C.sky); txt('G&M LAB', sx + 95, GY - 24, C.nusB, 1, 1); } });
  mover(5065, GY, 30, 23, 0, 0.8, 1, 'boat');
  add({ x: 5150, y: GY - 34, w: 40, h: 34, z: 1, draw(sx) {
    R(sx + 14, GY - 16, 26, 3, '#c9c2b0'); R(sx + 16, GY - 13, 2, 13, C.dgray); R(sx + 36, GY - 13, 2, 13, C.dgray); R(sx + 28, GY - 21, 4, 5, C.white); R(sx + 22, GY - 18, 5, 2, C.orange);
    humanoid(sx + 8, GY, { ...POSE0, sr: 1.25 + Math.sin(T * 1.6) * 0.25, er: 0.25, sl: 0.9, el: 0.6 }, 1, HUMAN); } });
  add({ x: 5200, y: GY - 66, w: 60, h: 66, draw(sx) {
    const ok = solved('m_pose'); R(sx + 28, GY - 24, 4, 24, C.dgray); R(sx + 18, GY - 3, 24, 3, C.dgray); R(sx, GY - 66, 60, 42, C.ink); const x = sx + 2, y = GY - 64; R(x, y, 56, 38, '#0e1426');
    for (let i = 0; i < 4; i++) R(x, y + 24 + i * 4, 56, 1, '#1b2a4d'); for (let i = 0; i < 7; i++) L(x + 28, y + 22, x + i * 9, y + 37, '#1b2a4d');
    const pr = rng(5); for (let i = 0; i < 26; i++) R(x + 3 + pr() * 50, y + 14 + pr() * 22, 1, 1, '#5f8fd0');
    const bc = ok ? C.gold : Math.floor(T * 4) % 2 ? C.red : '#5a1a1a', bx = x + 34, by = y + 18; R(bx + 2, by + 4, 6, 7, C.white);
    L(bx, by + 2, bx + 9, by + 2, bc); L(bx, by + 2, bx, by + 12, bc); L(bx + 9, by + 2, bx + 9, by + 12, bc); L(bx, by + 12, bx + 9, by + 12, bc);
    L(bx, by + 2, bx + 3, by - 1, bc); L(bx + 9, by + 2, bx + 12, by - 1, bc); L(bx + 3, by - 1, bx + 12, by - 1, bc); L(bx + 12, by - 1, bx + 12, by + 9, bc); L(bx + 9, by + 12, bx + 12, by + 9, bc);
    const hx = x + 14 + Math.round(Math.sin(T * 1.2) * 4), hy = y + 26; for (const [dx, dy] of [[-4, -6], [-1, -8], [2, -8], [5, -6], [6, -2]]) L(hx, hy, hx + dx, hy + dy, C.cyan); R(hx - 1, hy - 1, 3, 3, C.cyan);
    L(x + 3, y + 3, x + 10, y + 7, C.mag); L(x + 3, y + 3, x + 10, y + 1, C.mag); L(x + 10, y + 1, x + 10, y + 7, C.mag); txt('MANO', x + 6, y + 30, C.cyan); txt(ok ? '6-DOF' : '6-DOF?', x + 26, y + 3, bc); } });
  solid(5340, GY - 10, 150, 10, 'hill', { label: 'KENT RIDGE' }); solid(5360, GY - 20, 110, 10, 'hill'); solid(5380, GY - 30, 70, 10, 'hill');
  add({ x: 5510, y: GY - 60, w: 70, h: 60, draw(sx) {
    const ok = solved('m_hand'), gk = ok ? Math.sin(T * 1.4) * 0.5 + 0.5 : 0.25 + Math.random() * 0.3;
    R(sx + 34, GY - 20, 26, 20, C.dgray); R(sx + 34, GY - 20, 26, 2, C.gray); R(sx + 35, GY - 13, 24, 9, C.ink); txt('WUJI', sx + 47, GY - 12, C.white, 1, 1);
    ctx.globalAlpha = 0.85; const t1 = hand(sx + 14, GY - 18, gk, 0.85, C.mag, true); ctx.globalAlpha = 1; R(sx + 13, GY - 18, 3, 18, '#5a2a45');
    const t2 = hand(sx + 47, GY - 22, gk, 1, { body: '#b9bfcc', hi: C.white, finger: '#d6dbe6', joint: C.vdgray }, false);
    for (let i = 0; i < 5; i++) dots(t1[i][0], t1[i][1], t2[i][0], t2[i][1], ok ? C.cyan : C.red, 4);
    if (ok && gk > 0.6) disc(ctx, sx + 53, GY - 40, 3, C.orange);
    txtS('MINK IK + MPPI', sx + 35, GY - 66, ok ? C.cyan : C.gray, 1, 1); } });
  add({ x: 5640, y: GY - 96, w: 150, h: 96, draw(sx) {
    R(sx, GY - 24, 150, 24, '#5a6075'); R(sx - 2, GY - 26, 154, 3, '#d6dbe6'); for (let i = 0; i < 5; i++) { R(sx + 6 + i * 29, GY - 20, 24, 16, C.dgray); R(sx + 16 + i * 29, GY - 13, 4, 1, C.lgray); }
    R(sx + 52, GY - 28, 30, 2, C.ink); R(sx + 58, GY - 29, 18, 1, Math.floor(T * 6) % 2 ? C.red : C.orange); R(sx + 96, GY - 28, 22, 2, '#c08a52'); R(sx + 100, GY - 31, 3, 3, C.orange); R(sx + 106, GY - 31, 4, 3, C.lime);
    const px = sx + 68 + Math.sin(T * 0.9) * 6, py = GY - 30 - Math.max(0, Math.sin(T * 1.8)) * 4;
    R(px - 7, py - 6, 14, 6, C.gray); R(px - 8, py - 6, 16, 1, C.lgray); R(px - 11, py - 5, 4, 1, C.vdgray); R(px + 7, py - 5, 4, 1, C.vdgray);
    fr3(sx + 28, GY - 26, px - 10, py - 4); const e = fr3(sx + 122, GY - 26, px + Math.cos(T * 3) * 3, py - 12); L(e[0], e[1], e[0], py - 3, C.wood);
    txtS('2X FR3 · 14 DOF', sx + 75, GY - 94, C.white, 1, 1); } });
  add({ x: 6130, y: GY - 32, w: 52, h: 32, draw(sx) { R(sx + 24, GY - 24, 3, 24, C.dgray); R(sx, GY - 34, 52, 11, C.nusB); txt('NEXT →', sx + 26, GY - 32, C.white, 1, 1); } });
  // ---------- next stop ----------
  add({ x: 6300, y: GY - 58, w: 26, h: 58, entry: 'skills', tag: { zh: '技能石碑', en: 'Skill tablet' }, draw(sx) {
    R(sx - 3, GY - 4, 32, 4, '#3b3f4e'); R(sx, GY - 46, 26, 42, C.dgray); R(sx, GY - 46, 26, 2, '#6b7186'); R(sx, GY - 46, 2, 42, '#6b7186'); R(sx + 1, GY - 48, 24, 2, C.dgray);
    GEMS.forEach((gm, i) => { const c = i % 4, r = Math.floor(i / 4); R(sx + 4 + c * 5, GY - 41 + r * 6, 3, 3, S.gems.has(gm.id) ? GEMCOL[gm.k][0] : C.vdgray); });
    txtS('SKILLS', sx + 13, GY - 58 + Math.round(Math.sin(T * 2)), C.cyan, 1, 1); } });
  add({ x: 6480, y: GY - 30, w: 18, h: 30, entry: 'contact', tag: { zh: '邮箱 · 联系方式', en: 'Mailbox · contact' }, draw(sx) {
    R(sx + 5, GY - 16, 4, 16, C.wood); R(sx, GY - 26, 14, 10, C.red); R(sx + 1, GY - 27, 12, 1, C.red); R(sx + 3, GY - 22, 8, 1, C.ink); R(sx, GY - 26, 14, 1, '#f07a6a');
    R(sx + 14, GY - 30, 1, 9, C.vdgray); if (!S.read.has('contact')) R(sx + 15, GY - 30, 4, 3, C.gold); } });
  add({ x: 6700, y: GY - 92, w: 16, h: 92, action: 'finale', tag: { zh: '终点旗', en: 'Goal flag' }, draw(sx) {
    R(sx, GY - 6, 16, 6, C.dgray); R(sx, GY - 6, 16, 1, C.gray); R(sx + 7, GY - 86, 2, 80, C.lgray); R(sx + 6, GY - 89, 4, 3, C.gold);
    const fy = Math.round(lerp(GY - 22, GY - 84, S.flag === 2 ? 1 : S.flagK));
    for (let i = 0; i < 20; i++) { const w = Math.round(Math.sin(T * 6 + i * 0.5)); R(sx + 9 + i, fy + w, 1, 12, i > 16 ? '#b0335f' : C.mag); }
    txt('Z', sx + 16, fy + 3, C.white); } });
}

// ===================== game state =====================
const cam = { x: 0, look: 0 };
const P = { x: 40, y: GY - 22, w: 10, h: 22, vx: 0, vy: 0, face: 1, onGround: true, coyote: 0, jb: 0, anim: 0, stand: null,
  hp: 6, maxHp: 6, inv: 0, kb: 0, cd: 0, atk: 0, drop: 0, dead: false, deadT: 0, safeX: 40, spring: false, warned: -9 };
const DRONE = { x: 20, y: GY - 44 };
const K = {}; let pressed = new Set();
let mode = 'title', near = null, hover = null, curZone = null, flight = null, shake = 0;
const PS = [], FT = [], M = [], SHOTS = [], EB = [], DROPS = [], BEAMS = [];
const FLIGHT_DUR = 3.4, MID_GAP = (GAP0 + GAP1) / 2;
const zoneAt = (x) => ZONES.find((z) => x >= z.x0 && x < z.x1) || null;
function zoneWeights(x) {
  const B = 90; const z = zoneAt(x) || (x < MID_GAP ? ZMAP.air : ZMAP.nus); const i = ZONES.indexOf(z);
  if (x - z.x0 < B && i > 0 && ZONES[i - 1].x1 === z.x0) { const k = 0.5 + (x - z.x0) / (2 * B); return [[ZONES[i - 1].id, 1 - k], [z.id, k]]; }
  if (z.x1 - x < B && i < ZONES.length - 1 && ZONES[i + 1].x0 === z.x1) { const k = 0.5 - (z.x1 - x) / (2 * B); return [[z.id, 1 - k], [ZONES[i + 1].id, k]]; }
  return [[z.id, 1]];
}
function dateAt(x) {
  const m = TL.map(([px, y, mo]) => [px, y * 12 + mo - 1]); let v = m[m.length - 1][1];
  for (let i = 0; i < m.length - 1; i++) if (x < m[i + 1][0]) { v = lerp(m[i][1], m[i + 1][1], clamp((x - m[i][0]) / (m[i + 1][0] - m[i][0]), 0, 1)); break; }
  v = Math.floor(v); return `${Math.floor(v / 12)}.${String((v % 12) + 1).padStart(2, '0')}`;
}

// ===================== physics (player, monsters and drops share it) =====================
const hit = (a, s) => a.x < s.x + s.w && a.x + a.w > s.x && a.y < s.y + s.h && a.y + a.h > s.y;
function moveX(e, dx) {
  e.x += dx; e.bump = 0;
  for (const s of SOLIDS) {
    if (s.oneway || !hit(e, s)) continue;
    if (s.kind !== 'wall' && e.y + e.h - s.y <= 6.5 && e.vy >= 0) { e.y = s.y - e.h; continue; }
    if (dx > 0) e.x = s.x - e.w; else if (dx < 0) e.x = s.x + s.w; e.vx = 0; e.bump = dx > 0 ? 1 : -1;
  }
}
function moveY(e, dy) {
  const pb = e.y + e.h; e.y += dy; e.onGround = false; e.stand = null;
  for (const s of SOLIDS) {
    if (!hit(e, s)) continue;
    if (s.oneway) { if (dy >= 0 && pb <= s.y + 0.5 && !(e.drop > 0)) { e.y = s.y - e.h; e.vy = 0; e.onGround = true; e.stand = s; } continue; }
    if (dy > 0) {
      e.y = s.y - e.h; e.onGround = true; e.stand = s;
      if (s.kind === 'spring' && e === P) { e.vy = -430; e.onGround = false; e.spring = true; s.sq = 0.25; SFX.spring(); } else e.vy = 0;
    } else if (dy < 0) { e.y = s.y + s.h; e.vy = 0; }
  }
  if (e.y + e.h >= GY && pb <= GY + 0.5 && (e.noPit || !overPit(e))) { e.y = GY - e.h; e.vy = 0; e.onGround = true; e.stand = null; }
}
function updateMovers() {
  for (const s of MOVERS) { const k = Math.sin(T * s.sp + s.ph), nx = s.bx + k * s.ax, ny = s.by + k * s.ay; s.dx = nx - s.x; s.dy = ny - s.y; s.x = nx; s.y = ny; }
  if (P.stand && P.stand.move) { P.x += P.stand.dx; P.y += P.stand.dy; }
  for (const d of DROPS) if (d.stand && d.stand.move) { d.x += d.stand.dx; d.y += d.stand.dy; }
}
function teleport(x, keepZone) {
  const pit = overPit({ x, w: P.w }); if (pit) x = pit.x0 - P.w - 2;
  P.x = x; P.y = groundAt(P.x, P.x + P.w) - P.h; P.vx = 0; P.vy = 0; P.stand = null; P.safeX = P.x; DRONE.x = P.x - 10; DRONE.y = P.y - 16;
  if (!keepZone) curZone = null; updateCamera(0, true);
}
function updateCamera(dt, snap) {
  cam.look = snap ? P.face * 26 : lerp(cam.look, P.face * 26, Math.min(1, dt * 2));
  let lo = 0, hi = WORLD_W - VW; if (P.x < MID_GAP) hi = Math.min(hi, GAP0 - VW); else lo = Math.max(lo, GAP1);
  const tx = clamp(P.x + P.w / 2 + cam.look - VW / 2, lo, Math.max(lo, hi));
  cam.x = snap ? tx : clamp(lerp(cam.x, tx, Math.min(1, dt * 6)), lo, Math.max(lo, hi));
}

// ===================== particles =====================
function puff(x, y, n, c, o = {}) {
  for (let i = 0; i < n && PS.length < 420; i++) {
    let vx = (Math.random() - 0.5) * (o.sp ?? 40), vy = -Math.random() * (o.up ?? 30);
    if (o.burst) { const a = Math.random() * Math.PI * 2, s = o.burst * (0.4 + Math.random() * 0.6); vx = Math.cos(a) * s; vy = Math.sin(a) * s; }
    const life = (o.life ?? 0.5) * (0.7 + Math.random() * 0.6);
    PS.push({ x, y, vx, vy, life, max: life, c: Array.isArray(c) ? c[i % c.length] : c, g: o.g ?? 80, s: o.s ?? 1, k: o.k || '', seed: Math.random() * 6 });
  }
}
function floatText(s, x, y, c) { FT.push({ s, x, y, c, life: 1.3 }); }
function updateParticles(dt) {
  for (let i = PS.length - 1; i >= 0; i--) { const p = PS[i]; p.life -= dt; if (p.life <= 0) { PS.splice(i, 1); continue; }
    if (p.k === 'leaf') p.vx = Math.sin(T * 2 + p.seed) * 12; else if (p.k === 'fly') { p.vx = (p.vx + (Math.random() - 0.5) * 60 * dt) * 0.99; p.vy = (p.vy + (Math.random() - 0.5) * 60 * dt) * 0.99; } else p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; }
  for (let i = FT.length - 1; i >= 0; i--) { FT[i].life -= dt; FT[i].y -= 14 * dt; if (FT[i].life <= 0) FT.splice(i, 1); }
  for (let i = BEAMS.length - 1; i >= 0; i--) { BEAMS[i].life -= dt; if (BEAMS[i].life <= 0) BEAMS.splice(i, 1); }
}
function ambient(dt) {
  const z = zoneAt(cam.x + VW / 2); if (!z) return; const rx = () => cam.x + Math.random() * VW;
  if (z.id === 'bit' && Math.random() < dt * 3) PS.push({ x: rx(), y: -4, vx: 0, vy: 16, life: 11, max: 11, c: Math.random() < 0.5 ? C.gold : '#e0a93a', g: 0, s: 2, k: 'leaf', seed: Math.random() * 6 });
  if (z.id === 'thesis' && Math.random() < dt * 7) PS.push({ x: rx(), y: GY - 1, vx: 0, vy: -10 - Math.random() * 14, life: 3, max: 3, c: Math.random() < 0.5 ? C.cyan : C.blue, g: 0, s: 1, k: '', seed: 0 });
  if (z.id === 'oak' && Math.random() < dt * 2) PS.push({ x: rx(), y: Math.random() * GY, vx: 4, vy: 2, life: 5, max: 5, c: '#f2d8a8', g: 0, s: 1, k: '', seed: 0 });
  if ((z.id === 'end' || z.id === 'start') && Math.random() < dt * 2.2 && PS.length < 200) PS.push({ x: rx(), y: GY - 8 - Math.random() * 70, vx: 0, vy: 0, life: 5, max: 5, c: '#d8f78a', g: 0, s: 1, k: 'fly', seed: Math.random() * 6 });
}

// ===================== monsters =====================
function makeMon(d, bug) {
  const m = { ...d, bug, maxHp: Math.max(1, Math.round(d.hp * DF().monHp)), hx: d.x, hy: d.y, vx: 0, vy: 0, face: -1, t: Math.random() * 3, cd: 1 + Math.random(), flash: 0, dead: false, deadT: 0, state: 'idle', st: 0, tele: 0, onGround: false, stand: null };
  m.y = d.type === 'flyer' ? d.y : groundAt(m.x, m.x + m.w) - m.h; m.hp = m.maxHp;
  if (!bug && S.killed.has(d.id)) m.dead = true;
  return m;
}
function resetMon(m) { Object.assign(m, { hp: m.maxHp, x: m.hx, vx: 0, vy: 0, state: 'idle', tele: 0, flash: 0 }); m.y = m.type === 'flyer' ? m.hy : groundAt(m.x, m.x + m.w) - m.h; }
function spawnMonsters() {
  M.length = 0;
  for (const d of MONSTERS) M.push(makeMon(d, false));
  BUGS.forEach((b, i) => M.push(makeMon({ id: 'bug' + i, look: 'bug', type: 'walker', x: b.x, min: b.min, max: b.max, w: 10, h: 7, hp: 2, weak: [], gems: [], n: { zh: 'Bug', en: 'Bug' } }, true)));
}
function groundPhys(m, dt) { m.vy = Math.min(400, m.vy + 760 * dt); moveX(m, m.vx * dt); moveY(m, m.vy * dt); }
function fireEB(m, dx, dy) {
  const D = DF(), a0 = Math.atan2(dy, dx), sp = (m.shot === 'z' ? 45 : 85) * D.bullet, n = D.spread;
  for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.28;
    EB.push({ x: m.x + m.w / 2, y: m.y + m.h / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: m.shot === 'z' ? 3.2 : 2.2, k: m.shot, ch: Math.random() < 0.5 ? '0' : '1', t: 0 }); }
  SFX.eshot();
}
function updateMons(dt) {
  const px = P.x + P.w / 2, py = P.y + P.h / 2, D = DF();
  for (const m of M) {
    if (m.dead) {
      if (m.bug) { m.deadT += dt; if (m.deadT > 25 && (m.hx < cam.x - 40 || m.hx > cam.x + VW + 40)) { m.dead = false; resetMon(m); } }
      continue;
    }
    if (m.hx < cam.x - 220 || m.hx > cam.x + VW + 220) continue;
    m.t += dt; m.flash = Math.max(0, m.flash - dt); m.cd -= dt;
    const rage = D.boss >= 2 && m.type === 'boss' && m.hp < m.maxHp / 2, spd = D.spd * (rage ? 1.3 : 1), cdk = D.cd * (rage ? 0.7 : 1), ag = D.aggro;
    const mx = m.x + m.w / 2, my = m.y + m.h / 2, dx = px - mx, adx = Math.abs(dx), near = !P.dead && adx < 150 * ag && Math.abs(py - my) < 70 * ag;
    if (m.type === 'walker') {
      if (m.state === 'charge') { m.vx = m.face * 78 * spd; m.st -= dt; if (m.st <= 0) { m.state = 'rest'; m.st = 0.8 * cdk; } }
      else if (m.state === 'rest') { m.vx *= 0.8; m.st -= dt; if (m.st <= 0) m.state = 'idle'; }
      else { m.vx = m.face * (m.bug ? 18 : 24) * spd; if (near && adx < 110 * ag && m.cd <= 0) { m.face = Math.sign(dx) || 1; m.state = 'charge'; m.st = 1.0; m.cd = 2.2 * cdk; } }
      groundPhys(m, dt);
      if (m.bump) m.face = -m.bump;
      if (m.x < m.min) { m.x = m.min; m.face = 1; if (m.state === 'charge') { m.state = 'rest'; m.st = 0.6; } }
      if (m.x > m.max) { m.x = m.max; m.face = -1; if (m.state === 'charge') { m.state = 'rest'; m.st = 0.6; } }
    } else if (m.type === 'hopper') {
      if (m.onGround) {
        m.vx = 0;
        if (m.cd <= 0) { const toward = near && adx < 130 * ag; m.face = toward ? Math.sign(dx) || 1 : Math.random() < 0.5 ? -1 : 1; let vx = m.face * (toward ? 70 : 35) * spd;
          const land = m.x + vx * 0.55; if (land < m.min || land > m.max) vx = -vx * 0.6; m.vx = vx; m.vy = toward ? -220 : -150; m.cd = (toward ? 0.9 : 1.3 + Math.random() * 0.6) * cdk; }
      }
      groundPhys(m, dt);
      if (m.x < m.min) { m.x = m.min; m.vx = Math.abs(m.vx); } if (m.x > m.max) { m.x = m.max; m.vx = -Math.abs(m.vx); }
    } else if (m.type === 'flyer') {
      if (m.state === 'swoop') { const a = Math.atan2(py - my, dx); m.x += Math.cos(a) * 72 * spd * dt; m.y += Math.sin(a) * 72 * spd * dt; m.st -= dt; if (m.st <= 0 || P.dead) m.state = 'back'; }
      else {
        const tx = m.hx + Math.sin(m.t * 0.9) * m.rx - m.w / 2, ty = m.hy + Math.sin(m.t * 1.7) * 8;
        m.x = lerp(m.x, tx, Math.min(1, dt * 2)); m.y = lerp(m.y, ty, Math.min(1, dt * 2));
        if (m.state === 'back' && Math.abs(m.x - tx) < 4 && Math.abs(m.y - ty) < 4) m.state = 'idle';
        if (m.state === 'idle' && near && adx < 120 * ag && m.cd <= 0) { if (m.shot) { fireEB(m, dx, py - my); m.cd = 2.4 * cdk; } else { m.state = 'swoop'; m.st = 1.1; m.cd = 3.0 * cdk; } }
      }
      m.face = dx < 0 ? -1 : 1;
    } else if (m.type === 'turret') {
      m.face = dx < 0 ? -1 : 1;
      if (m.tele > 0) { m.tele -= dt; if (m.tele <= 0) fireEB(m, dx, py - my); } else if (near && adx < 170 * ag && m.cd <= 0) { m.tele = 0.45 * Math.max(0.7, cdk); m.cd = 2.3 * cdk; }
      groundPhys(m, dt);
    } else if (m.type === 'boss') {
      if (m.onGround && m.state === 'jump') {
        m.state = 'idle'; shake = 0.2; SFX.stomp(); puff(m.x + m.w / 2, m.y + m.h, 10, [C.lgray, C.cyan], { sp: 90, up: 20, life: 0.4, g: 40 });
        const speeds = D.boss >= 2 ? [100, 165] : D.boss === 1 ? [130] : [100];
        for (const s of [-1, 1]) for (const v of speeds) EB.push({ x: m.x + m.w / 2, y: m.y + m.h - 5, vx: s * v, vy: 0, life: 0.8, k: 'wave', minx: 2432, maxx: 2512, t: 0 });
      }
      if (m.state !== 'jump') { m.vx = m.face * 18 * spd; if (near && m.cd <= 0 && m.onGround) { m.state = 'jump'; m.vy = -230; m.vx = clamp(dx, -40, 40) * spd; m.cd = 3.0 * cdk; } }
      groundPhys(m, dt);
      if (m.x < m.min) { m.x = m.min; m.face = 1; } if (m.x > m.max) { m.x = m.max; m.face = -1; }
    }
  }
}

// ===================== combat =====================
function nearestMon(x, y, r, dir) {
  let best = null, bd = r;
  for (const m of M) { if (m.dead) continue; const mx = m.x + m.w / 2, my = m.y + m.h / 2; if (dir && Math.sign(mx - x) !== dir && Math.abs(mx - x) > 6) continue; const d = Math.hypot(mx - x, my - y); if (d < bd) { bd = d; best = m; } }
  return best;
}
// Aim: an explicit point (mouse / finger, world coords) or, from J/X/pad, the nearest live monster in front.
function aimAngle(ox, oy, aim) {
  if (aim) return Math.atan2(aim.y - oy, aim.x - ox);
  const f = P.face; let best = null, bd = 1e9;
  for (const m of M) { if (m.dead) continue; const mx = m.x + m.w / 2, my = m.y + m.h / 2, dx = mx - ox, dy = my - oy;
    if (dx * f < -4 || Math.abs(dx) > 220 || Math.abs(dy) > 90) continue; const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = [mx, my]; } }
  return best ? Math.atan2(best[1] - oy, best[0] - ox) : f > 0 ? 0 : Math.PI;
}
function attack(aim) {
  if (!S.wpn) { if (T - P.warned > 3) { P.warned = T; toast(u('wLbl'), u('needWeapon')); } return; }
  if (P.cd > 0) return;
  if (aim) P.face = aim.x >= P.x + P.w / 2 ? 1 : -1;
  const W = WEAPONS[S.wpn], pt = PAT[W.k], f = P.face, ox = P.x + P.w / 2 + f * 5, oy = P.y + 13;
  const a = aimAngle(ox, oy, aim), cs = Math.cos(a), sn = Math.sin(a); P.cd = pt.cd; P.atk = 0.14; P.aim = a;
  const shot = (vx, vy, o = {}) => SHOTS.push({ x: ox, y: oy, vx, vy, life: pt.life, w: S.wpn, k: W.k, c: W.c, g: 0, t: 0, ...o });
  if (W.k === 'bolt') shot(cs * pt.spd, sn * pt.spd);
  else if (W.k === 'twin') { for (const d of [-3, 3]) shot(cs * pt.spd, sn * pt.spd, { x: ox - sn * d, y: oy + cs * d }); }
  else if (W.k === 'dagger') shot(cs * pt.spd, sn * pt.spd, { pierce: true });
  else if (W.k === 'seek') shot(cs * pt.spd, sn * pt.spd, { seek: true });
  else if (W.k === 'lob') shot(cs * pt.spd, sn * pt.spd - 150, { g: 520 });
  else if (W.k === 'fan') { for (let i = -2; i <= 2; i++) { const b = a + i * 0.16; shot(Math.cos(b) * pt.spd, Math.sin(b) * pt.spd, { pellet: true }); } }
  else if (W.k === 'snap') {
    let m = null;
    if (aim) { let bd = 60; for (const q of M) { if (q.dead) continue; const qx = q.x + q.w / 2, qy = q.y + q.h / 2, d = Math.hypot(qx - aim.x, qy - aim.y); if (d < bd && Math.hypot(qx - ox, qy - oy) < pt.range + 20) { bd = d; m = q; } } }
    else m = nearestMon(ox, oy, pt.range, f);
    if (m) { BEAMS.push({ x0: ox, y0: oy, x1: m.x + m.w / 2, y1: m.y + m.h / 2, life: 0.18, c: W.c }); damageMon(m, S.wpn, false); }
    else BEAMS.push({ x0: ox, y0: oy, x1: ox + cs * 40, y1: oy + sn * 40, life: 0.12, c: C.gray });
  }
  SFX.shoot(W.k);
}
function damageMon(m, w, pellet, stomp) {
  if (m.dead) return;
  const D = DF(), eff = !!w && m.weak.includes(w), cx = m.x + m.w / 2;
  let dmg = stomp ? D.stomp : pellet ? (eff ? 2 : 1) : (eff ? 3 : 1); if (!eff && !stomp && !m.bug) dmg *= D.chip;
  if (dmg <= 0) { if (T - (m.resT ?? -9) > 0.6) { m.resT = T; floatText('RESIST', cx, m.y - 8, C.gray); SFX.hit(false); } puff(cx, m.y + m.h / 2, 2, C.gray, { burst: 30, life: 0.2, g: 0 }); return; }
  m.hp -= dmg; m.flash = 0.12;
  if (m.type === 'walker' || m.type === 'hopper') m.vx += (cx < P.x + P.w / 2 ? -1 : 1) * 30;
  floatText(eff ? `-${dmg}!` : `-${dmg}`, cx, m.y - 8, eff ? C.gold : C.lgray);
  if (eff && !m.effShown) { m.effShown = true; floatText('EFFECTIVE!', cx, m.y - 18, C.gold); }
  SFX.hit(eff); puff(cx, m.y + m.h / 2, eff ? 8 : 4, eff ? [WEAPONS[w].c, C.white] : [C.lgray], { burst: 50, life: 0.3, g: 60 });
  if (m.hp <= 0) killMon(m);
}
function killMon(m) {
  m.dead = true; m.deadT = 0; const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  puff(cx, cy, 24, [C.white, C.gold, C.mag, C.cyan], { burst: 90, life: 0.6, g: 80 }); SFX.kill(); shake = Math.max(shake, 0.15);
  const D = DF(), lv = DIFFS.indexOf(S.diff);
  unlock('firstkill');
  if (m.bug) { if (Math.random() < D.coffeeBug) spawnDrop('coffee', null, cx, cy); return; }
  S.killed.add(m.id); S.best[m.id] = Math.max(S.best[m.id] ?? -1, lv); floatText('DEFEATED', cx, m.y - 14, C.gold);
  if (m.entry && !S.read.has(m.entry)) spawnDrop('proj', m.entry, cx, cy);
  for (const g of m.gems) if (!S.gems.has(g)) spawnDrop('gem', g, cx, cy);
  if (D.coffeeBoss === 'any' ? P.hp < P.maxHp : D.coffeeBoss === 'half' && P.hp <= P.maxHp / 2) spawnDrop('coffee', null, cx, cy);
  if (m.id === 'm_golem') { unlock('boss'); if (lv >= 2) unlock('hardboss'); }
  if (MONSTERS.every((d) => S.killed.has(d.id))) unlock('allprojects');
  if (MONSTERS.every((d) => S.best[d.id] === 3)) unlock('hardcore');
  hudDirty = true; save();
}
function spawnDrop(kind, id, x, y, still) {
  DROPS.push({ kind, id, x: x - 4, y: y - 4, w: 8, h: 8, vx: still ? 0 : (Math.random() - 0.5) * 120, vy: still ? 0 : -170 - Math.random() * 60, t: still ? 1 : 0, noPit: true, onGround: false, stand: null });
}
function restoreDrops() {
  for (const d of MONSTERS) {
    if (!S.killed.has(d.id)) continue; const x = d.x + d.w / 2, y = (d.type === 'flyer' ? d.y : groundAt(d.x, d.x + d.w)) - 10;
    if (d.entry && !S.read.has(d.entry)) spawnDrop('proj', d.entry, x, y, true);
    d.gems.forEach((g, i) => { if (!S.gems.has(g)) spawnDrop('gem', g, x + (i + 1) * 9, y, true); });
  }
}
function updateDrops(dt) {
  for (let i = DROPS.length - 1; i >= 0; i--) {
    const d = DROPS[i]; d.t += dt; const dx = P.x + P.w / 2 - (d.x + 4), dy = P.y + P.h / 2 - (d.y + 4), dist = Math.hypot(dx, dy) || 1;
    if (d.t > 0.5 && dist < 30 && !P.dead) { d.x += (dx / dist) * 150 * dt; d.y += (dy / dist) * 150 * dt; d.vy = 0; }
    else {
      d.vy = Math.min(300, d.vy + 600 * dt); d.vx *= d.onGround ? 0.8 : 0.99; moveX(d, d.vx * dt); moveY(d, d.vy * dt);
      const p = overPit(d); if (p && d.onGround) d.x += (d.x + 4 - p.x0 < p.x1 - d.x - 4 ? -1 : 1) * 50 * dt;
    }
    if (d.t > 0.35 && !P.dead && hit(P, d)) { DROPS.splice(i, 1); pickDrop(d); }
  }
}
function pickDrop(d) {
  if (d.kind === 'proj') { SFX.ach(); const m = MONSTERS.find((x) => x.entry === d.id); openDialog(d.id, m); }
  else if (d.kind === 'gem') collect(GEMBY[d.id], d.x + 4, d.y);
  else { P.hp = Math.min(P.maxHp, P.hp + 2); floatText('+2 HP', P.x + 5, P.y - 8, C.ok); SFX.heal(); hudDirty = true; }
}
function updateShots(dt) {
  for (let i = SHOTS.length - 1; i >= 0; i--) {
    const s = SHOTS[i]; s.t += dt; s.life -= dt;
    if (s.seek) { const m = nearestMon(s.x, s.y, 170); if (m) { const a = Math.atan2(m.y + m.h / 2 - s.y, m.x + m.w / 2 - s.x), sp = Math.hypot(s.vx, s.vy), cur = Math.atan2(s.vy, s.vx); let da = a - cur;
      while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; const na = cur + clamp(da, -5 * dt, 5 * dt); s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; } }
    s.vy += s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt;
    let dead = s.life <= 0 || (s.y > GY && !PITS.some((p) => s.x > p.x0 && s.x < p.x1)) || s.y > H + 10;
    if (!dead) for (const o of SOLIDS) if (!o.oneway && s.x > o.x && s.x < o.x + o.w && s.y > o.y && s.y < o.y + o.h) { dead = true; break; }
    if (!dead) for (const m of M) {
      if (m.dead || (s.hit && s.hit.has(m))) continue;
      if (s.x > m.x - 3 && s.x < m.x + m.w + 3 && s.y > m.y - 3 && s.y < m.y + m.h + 3) {
        if (s.k === 'lob') { dead = true; break; }
        damageMon(m, s.w, s.pellet); if (s.pierce) (s.hit || (s.hit = new Set())).add(m); else { dead = true; break; }
      }
    }
    if (dead) {
      if (s.k === 'lob') { puff(s.x, s.y, 12, [C.white, C.ink, s.c], { burst: 70, life: 0.35, g: 60 }); for (const m of M) if (!m.dead && Math.hypot(m.x + m.w / 2 - s.x, m.y + m.h / 2 - s.y) < 20) damageMon(m, s.w, false); }
      else puff(s.x, s.y, 3, s.c, { burst: 30, life: 0.2, g: 0 });
      SHOTS.splice(i, 1);
    }
  }
}
function updateEB(dt) {
  for (let i = EB.length - 1; i >= 0; i--) {
    const b = EB[i]; b.t += dt; b.life -= dt; if (b.k === 'z') b.vy = Math.sin(b.t * 4) * 20 + (P.y + 11 > b.y ? 6 : -6);
    b.x += b.vx * dt; b.y += b.vy * dt;
    let dead = b.life <= 0 || (b.k === 'wave' && (b.x < b.minx || b.x > b.maxx));
    if (!dead && b.k !== 'wave') for (const o of SOLIDS) if (!o.oneway && b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h) { dead = true; break; }
    if (!dead && !P.dead && b.x > P.x - 2 && b.x < P.x + P.w + 2 && b.y > P.y && b.y < P.y + P.h) { hurtPlayer(1, b.x); dead = true; }
    if (dead) EB.splice(i, 1);
  }
}
function updatePickups() {
  for (const id of WIDS) {
    if (S.weapons.has(id)) continue; const W = WEAPONS[id], y = (W.y ?? GY - 16) + Math.sin(T * 3 + W.x) * 2;
    if (P.x < W.x + 9 && P.x + P.w > W.x - 9 && P.y < y + 6 && P.y + P.h > y - 6) gainWeapon(id);
  }
  for (const g of GEMS) { if (g.x == null || S.gems.has(g.id)) continue; const by = g.y + Math.sin(T * 3 + g.x) * 2; if (P.x < g.x + 4 && P.x + P.w > g.x - 4 && P.y < by + 5 && P.y + P.h > by - 5) collect(g, g.x, g.y); }
}
function gainWeapon(id) {
  const W = WEAPONS[id], y = W.y ?? GY - 16; S.weapons.add(id); S.wpn = id; SFX.weapon();
  puff(W.x, y, 14, [W.c, C.white], { burst: 60, life: 0.5, g: 40 }); floatText('+' + (W.lb || W.n).toUpperCase(), W.x, y - 14, W.c);
  const vs = MONSTERS.filter((m) => m.weak.includes(id)).map((m) => m.n[lang]).join(' / ');
  toast(u('gotWeapon'), wName(id), vs ? `${u('strongVs')}${lang === 'zh' ? '：' : ': '}${vs}` : IS_TOUCH ? u('attackTouch') : u('attackKb'));
  if (id === 'python' && !S.gems.has('python')) collect(GEMBY.python, W.x, y);
  hudDirty = true; save();
}
function cycleWeapon() {
  const own = WIDS.filter((id) => S.weapons.has(id)); if (own.length < 2) return;
  S.wpn = own[(own.indexOf(S.wpn) + 1) % own.length]; hudDirty = true; SFX.click(); const W = WEAPONS[S.wpn]; floatText((W.lb || W.n).toUpperCase(), P.x + 5, P.y - 10, W.c);
}
function collect(g, x, y) {
  if (!g || S.gems.has(g.id)) return; S.gems.add(g.id); SFX.gem(); puff(x, y, 14, GEMCOL[g.k], { burst: 50, life: 0.6, g: 40 });
  floatText('+' + g.n, x, y - 12, GEMCOL[g.k][0]); hudDirty = true; if (S.gems.size >= GEMS.length) unlock('gems'); save();
}
function hurtPlayer(dmg, fromX) {
  if (P.inv > 0 || P.dead || mode !== 'play') return;
  const D = DF(); if (!D.dmg) { P.inv = 0.5; return; }
  P.hp -= D.dmg * Math.max(1, dmg); P.inv = D.inv; P.kb = 0.22; P.vx = (P.x + P.w / 2 < fromX ? -1 : 1) * 150; P.vy = -170; P.onGround = false;
  shake = 0.25; SFX.hurt(); puff(P.x + 5, P.y + 10, 10, [C.red, C.white], { burst: 60, life: 0.35, g: 80 }); hudDirty = true; hpHurt = 0.5;
  if (P.hp <= 0) die();
}
function die() { P.dead = true; P.deadT = 1.3; P.hp = 0; P.vy = -200; SFX.die(); showMsg(u('respawn'), 1.6); hudDirty = true; }
function respawn() {
  P.dead = false; P.hp = P.maxHp; P.inv = 1.5; teleport(S.cp, true); EB.length = 0; SHOTS.length = 0;
  for (const m of M) if (!m.dead) resetMon(m); hudDirty = true;
}
function pitFall() {
  const D = DF(); if (!D.pit) { teleport(P.safeX, true); P.inv = 0.8; return; }
  P.hp -= D.pit; SFX.hurt(); hudDirty = true; hpHurt = 0.5; if (P.hp <= 0) { die(); P.y = H + 40; return; }
  showMsg(`${u('fell')} · HP -${D.pit}`, 1.1); teleport(P.safeX, true); P.inv = 1.2;
}

// ===================== main update =====================
function updateBots(dt) {
  patrol(TB, dt); patrol(LB, dt); patrol(CB, dt);
  const v = clamp((TB.x - 48 * TB.face - SB.x) * 2, -20, 20); SB.x += v * dt; SB.moving = Math.abs(v) > 3; if (v > 1) SB.face = 1; else if (v < -1) SB.face = -1; SB.ph += dt * Math.abs(v) * 0.28;
  for (const t of THINGS) if (t.bot) t.x = t.bot.x - 8;
}
function update(dt) {
  T += dt; const pr = pressed; pressed = new Set();
  if (pr.has('lang')) setLang(lang === 'zh' ? 'en' : 'zh');
  updateMovers();
  if (mode === 'title') {
    if (pr.has('act') || pr.has('jump')) startGame(false); else if (pr.has('resume')) openMenu('resume'); else if (pr.has('map')) openMenu('map');
    else if (pr.has('left') || pr.has('right')) setDiff(DIFFS[(DIFFS.indexOf(S.diff) + (pr.has('right') ? 1 : 3)) % 4]);
  }
  else if (mode === 'play') {
    if (pr.has('resume')) openMenu('resume'); else if (pr.has('map')) openMenu('map'); else if (pr.has('esc')) openMenu('help'); else playUpdate(dt, pr);
  } else if (mode === 'dialog') { if (pr.has('act') || pr.has('esc') || pr.has('jump')) closeDialog(); else if (pr.has('resume')) { closeDialog(); openMenu('resume'); } }
  else if (mode === 'menu') { if (pr.has('esc') || (pr.has('resume') && menuTab === 'resume') || (pr.has('map') && menuTab === 'map')) closeMenu(); else if (pr.has('resume')) setTab('resume'); else if (pr.has('map')) setTab('map'); }
  else if (mode === 'flight') { flight.t += dt; if (flight.t > FLIGHT_DUR || pr.has('act')) endFlight(); }
  else if (mode === 'ending') { if (pr.has('esc')) closeEnding(); }
  if (mode === 'play') { updateMons(dt); updateShots(dt); updateEB(dt); updateDrops(dt); } else near = null;
  updateBots(dt); updateParticles(dt); ambient(dt); updateCamera(dt);
  DRONE.x = lerp(DRONE.x, P.x + 5 - P.face * 14, Math.min(1, dt * 3)); DRONE.y = lerp(DRONE.y, P.y - 14, Math.min(1, dt * 3));
  shake = Math.max(0, shake - dt); hpHurt = Math.max(0, hpHurt - dt);
  for (const s of SOLIDS) if (s.sq > 0) s.sq = Math.max(0, s.sq - dt);
  if (S.flag === 1) { S.flagK = Math.min(1, S.flagK + dt / 1.6); if (Math.random() < dt * 5) firework();
    if (S.flagK >= 1) { S.flag = 2; unlock('goal'); save(); setTimeout(() => { if (mode === 'play') openEnding(); }, 900); } }
}
function playUpdate(dt, pr) {
  S.time += dt; P.inv = Math.max(0, P.inv - dt); P.cd = Math.max(0, P.cd - dt); P.atk = Math.max(0, P.atk - dt); P.kb = Math.max(0, P.kb - dt); P.drop = Math.max(0, P.drop - dt);
  if (P.dead) { P.deadT -= dt; P.vy = Math.min(420, P.vy + 760 * dt); P.y += P.vy * dt; if (P.deadT <= 0) respawn(); return; }
  const dir = P.kb > 0 ? 0 : (K.right ? 1 : 0) - (K.left ? 1 : 0), target = dir * (K.run ? 140 : 88), acc = P.onGround ? 1000 : 650;
  if (P.kb <= 0) { if (P.vx < target) P.vx = Math.min(target, P.vx + acc * dt); else if (P.vx > target) P.vx = Math.max(target, P.vx - acc * dt); }
  if (dir) P.face = dir;
  if (pr.has('down') && P.onGround && P.stand && P.stand.oneway) { P.drop = 0.25; P.onGround = false; P.stand = null; }
  P.jb = pr.has('jump') ? 0.12 : P.jb - dt; P.coyote = P.onGround ? 0.1 : P.coyote - dt;
  if (P.jb > 0 && P.coyote > 0) { P.vy = -258; P.jb = 0; P.coyote = 0; P.onGround = false; SFX.jump(); puff(P.x + 5, P.y + P.h, 4, C.lgray, { sp: 30, up: 10, life: 0.3, g: 20 }); }
  if (!K.jump && P.vy < -90 && !P.spring) P.vy += 1100 * dt;
  P.vy = Math.min(420, P.vy + 760 * dt); if (P.vy >= 0) P.spring = false;
  const air = !P.onGround, vyB = P.vy, pbB = P.y + P.h;
  moveX(P, P.vx * dt); if (P.onGround && P.stand && P.stand.kind === 'belt') moveX(P, P.stand.speed * dt); moveY(P, P.vy * dt);
  if (P.y + P.h > GY + 1) { const p = PITS.find((q) => P.x + P.w > q.x0 && P.x < q.x1); if (p) P.x = clamp(P.x, p.x0, p.x1 - P.w); if (P.y > GY + 28) { pitFall(); return; } }
  if (P.onGround && !(P.stand && P.stand.move) && !overPit(P)) P.safeX = P.x;
  if (air && P.onGround) puff(P.x + 5, P.y + P.h - 1, 5, C.lgray, { sp: 50, up: 8, life: 0.3, g: 20 });
  if (P.onGround && Math.abs(P.vx) > 120 && Math.random() < dt * 10) puff(P.x + 5 - P.face * 4, P.y + P.h - 1, 1, C.lgray, { sp: 10, up: 6, life: 0.3, g: 10 });
  P.anim += Math.abs(P.vx) * dt;
  if (pr.has('swap')) cycleWeapon();
  if (pr.has('atk') || (K.atk && P.cd <= 0)) attack(null);
  else if (mouseFire && ptr && P.cd <= 0) { const [ax, ay] = worldAt(ptr); attack({ x: ax, y: ay }); }
  for (const m of M) {
    if (m.dead || !hit(P, m)) continue;
    if (vyB > 30 && pbB <= m.y + 5) { damageMon(m, null, false, true); P.vy = -230; P.onGround = false; P.inv = Math.max(P.inv, 0.12); SFX.stomp(); }
    else hurtPlayer(1, m.x + m.w / 2);
  }
  updatePickups();
  near = findNear(); if (pr.has('act') && near) interact(near);
  const z = zoneAt(P.x + P.w / 2); if (z && z !== curZone) { curZone = z; S.cp = z.cp; showBanner(z); save(); }
  if (P.onGround && P.stand && P.stand.kind === 'stage') unlock('dance');
  if (solved('m_golem') && Math.abs(P.x - 2600) < 400) SC_K = Math.min(1, SC_K + dt * 0.7);
  if (S.flag === 0 && P.x + P.w > 6700 && P.x < 6716) finale(false);
  if ((T % 5) < dt) save();
}
function findNear() {
  const pc = P.x + P.w / 2; let best = null, bd = 1e9;
  for (const t of THINGS) { if (!t.entry && !t.action) continue;
    const d = pc < t.x ? t.x - pc : pc > t.x + t.w ? pc - (t.x + t.w) : 0; if (d > 10) continue; if (P.y > t.y + t.h + 4 || P.y + P.h < t.y - 30) continue;
    const dc = Math.abs(pc - (t.x + t.w / 2)); if (dc < bd) { bd = dc; best = t; } }
  return best;
}
function interact(t) {
  if (t.action === 'fly') startFlight(1); else if (t.action === 'flyback') startFlight(-1); else if (t.action === 'finale') finale(true); else if (t.entry) openDialog(t.entry);
}
function firework() { puff(6640 + Math.random() * 180, 24 + Math.random() * 70, 22, [C.gold, C.mag, C.cyan, C.ok, C.white], { burst: 70, life: 1, g: 40 }); SFX.pop(); }
function finale(fromInteract) { if (S.flag === 0) { S.flag = 1; S.flagK = 0; SFX.fanfare(); } else if (S.flag === 2 && fromInteract) openEnding(); }
function startFlight(dir) { mode = 'flight'; flight = { dir, t: 0 }; $('#fly').hidden = false; $('#flyRoute').textContent = dir > 0 ? u('flightTo') : u('flightBack'); hideTag(); SFX.fly(); SHOTS.length = 0; EB.length = 0; }
function endFlight() { const dir = flight.dir; $('#fly').hidden = true; flight = null; mode = 'play'; teleport(dir > 0 ? ZMAP.nus.cp : 4356); if (dir > 0) unlock('flight'); }

// ===================== render =====================
function drawTile(img, par, alpha, cx) { if (alpha <= 0.01) return; ctx.globalAlpha = alpha; const off = ((Math.floor(cx * par) % img.width) + img.width) % img.width; for (let x = -off; x < VW; x += img.width) ctx.drawImage(img, x, 0); ctx.globalAlpha = 1; }
function drawGround(cx) {
  for (let tx = Math.floor(cx / 16) * 16; tx < cx + VW; tx += 16) {
    const p = PITS.find((q) => tx >= q.x0 && tx < q.x1), x = tx - cx;
    if (!p) { const z = zoneAt(tx + 8); ctx.drawImage(GROUND[z ? z.g : 'air'], x, GY); continue; }
    if (p.k === 'water') {
      R(x, GY, 16, H - GY, '#2f6f9a'); R(x, GY + 14, 16, H - GY - 14, '#245a80'); R(x, GY + 1, 16, 1, '#7fbfe0');
      R(x + Math.floor((T * 10 + tx) % 16), GY + 3, 4, 1, '#bfe6f5'); R(x + Math.floor((T * 6 + tx * 3) % 16), GY + 9, 3, 1, '#7fbfe0');
    } else {
      R(x, GY, 16, H - GY, '#05070f'); R(x, GY + 8, 16, 1, '#121a33'); R(x, GY + 20, 16, 1, '#121a33'); R(x + 8, GY, 1, H - GY, '#121a33');
      if (Math.floor(T * 3 + tx) % 5 === 0) R(x + ((tx * 7) % 13), GY + 4 + ((tx * 3) % 20), 1, 1, C.mag);
    }
  }
  for (const p of PITS) {
    if (p.x1 < cx || p.x0 > cx + VW) continue; const x0 = p.x0 - cx, x1 = p.x1 - cx;
    R(x0, GY, 2, H - GY, '#00000066'); R(x1 - 2, GY, 2, H - GY, '#00000066');
    if (p.lily) for (const [ox, ph] of [[10, 0], [30, 2]]) { const y = GY + 1 + Math.round(Math.sin(T * 2 + ph)); R(x0 + ox, y, 7, 2, C.green); R(x0 + ox + 1, y, 2, 1, C.lime); R(x0 + ox + 5, y - 1, 1, 1, C.pink); }
    if (p.label) txt(p.label, (x0 + x1) / 2, GY + 12, C.mag, 1, 1);
  }
}
function drawSolids(cx) {
  for (const s of SOLIDS) {
    if (s.kind === 'wall' || s.kind === 'bench' || s.x + s.w < cx - 4 || s.x > cx + VW + 4) continue; const x = Math.round(s.x - cx), y = Math.round(s.y);
    if (s.kind === 'pyr') { R(x, y, s.w, s.h, '#2f4f88'); R(x, y, s.w, 2, '#6fa0e0'); R(x, y, 1, s.h, '#5f8fd0'); for (let gx = 10; gx < s.w; gx += 10) R(x + gx, y + 2, 1, s.h - 2, '#3f63a3'); }
    else if (s.kind === 'crate') { for (let yy = y; yy < GY; yy += 16) { R(x, yy, s.w, 16, '#a8743f'); R(x, yy, s.w, 1, '#c99a5a'); R(x, yy + 15, s.w, 1, '#6b4a2a'); R(x, yy, 1, 16, '#6b4a2a'); R(x + s.w - 1, yy, 1, 16, '#6b4a2a'); L(x + 2, yy + 2, x + s.w - 3, yy + 13, '#8a5a32'); L(x + s.w - 3, yy + 2, x + 2, yy + 13, '#8a5a32'); } }
    else if (s.kind === 'stage') { R(x, y, s.w, s.h, '#3a2a45'); R(x, y, s.w, 2, C.mag); for (let i = 4; i < s.w; i += 10) R(x + i, y + 6, 2, 2, (Math.floor(T * 4) + i / 10) % 2 ? C.gold : '#5a4a24'); }
    else if (s.kind === 'bump') { R(x, y, s.w, s.h, '#6b5a4a'); R(x, y, s.w, 1, '#8a7a62'); }
    else if (s.kind === 'box') { R(x, y, s.w, s.h, '#c8945a'); R(x, y, s.w, 1, '#e0b07a'); R(x, y, 1, s.h, C.wood); R(x + s.w - 1, y, 1, s.h, C.wood); R(x + s.w / 2 - 1, y, 2, 4, '#e0b07a'); aprilTag(x + Math.floor(s.w / 2) - 4, y + Math.floor(s.h / 2) - 3, s.seed * 7); }
    else if (s.kind === 'stone') { R(x, y, s.w, s.h, '#c9c2b0'); R(x, y, s.w, 2, '#e4ddca'); R(x, y + s.h - 2, s.w, 2, '#a39a84'); for (let gx = 16; gx < s.w; gx += 16) R(x + gx, y + 2, 1, s.h - 4, '#b3aa94'); }
    else if (s.kind === 'hill') { R(x, y, s.w, s.h, '#8a5a3a'); R(x, y, s.w, 3, '#3f9a4a'); R(x, y, s.w, 1, '#7fd16a'); R(x, y + 3, 1, s.h - 3, '#a06a44'); if (s.label) txt(s.label, x + s.w / 2, y + 3, '#f2d08a', 1, 1); }
    else if (s.kind === 'ledge') {
      if (s.look === 'steel') { L(x + 4, 0, x + 4, y, C.dgray); L(x + s.w - 5, 0, x + s.w - 5, y, C.dgray); R(x, y, s.w, 4, '#5f566e'); R(x, y, s.w, 1, '#8a8098'); for (let i = 3; i < s.w; i += 8) R(x + i, y + 2, 1, 1, C.lgray); }
      else { R(x, y, s.w, 4, '#2f4f88'); R(x, y, s.w, 1, '#6fa0e0'); ctx.globalAlpha = 0.25; R(x, y + 4, s.w, 3, C.cyan); ctx.globalAlpha = 1; }
    }
    else if (s.kind === 'mover') {
      if (s.look === 'boat') { R(x - 1, y, s.w + 2, 2, '#6b4a2a'); R(x, y + 2, s.w, 4, C.red); R(x + 2, y + 6, s.w - 4, 2, '#8a2f2a'); R(x + 3, y + 3, s.w - 6, 1, C.gold); R(x + 4, y - 13, 1, 13, C.brown); R(x + s.w - 5, y - 13, 1, 13, C.brown); R(x + 1, y - 15, s.w - 2, 3, C.nusB); R(x + 1, y - 15, s.w - 2, 1, C.sky); }
      else { R(x, y, s.w, 5, '#2f4f88'); R(x, y, s.w, 1, '#6fa0e0'); txt('<>', x + s.w / 2, y - 1 + 0, C.cyan, 1, 1); ctx.globalAlpha = 0.3; R(x, y + 5, s.w, 6, C.cyan); ctx.globalAlpha = 1; }
    }
    else if (s.kind === 'spring') { const q = s.sq > 0 ? 2 : 0; R(x, y + 4, s.w, 2, C.dgray); for (let i = 0; i < 3; i++) R(x + 2 + (i % 2) * 2, y + 1 + q + i, s.w - 6, 1, C.lgray); R(x - 1, y - 1 + q, s.w + 2, 2, C.red); R(x, y - 1 + q, s.w, 1, '#f07a6a'); }
    else if (s.kind === 'belt') { R(x, y, s.w, s.h, '#2b2833'); R(x, y, s.w, 1, '#57525f'); for (let i = 0; i < s.w; i += 8) R(x + ((((i + T * s.speed) % s.w) + s.w) % s.w), y + 1, 3, 1, C.gold); R(x, y + 2, 3, 3, C.gray); R(x + s.w - 3, y + 2, 3, 3, C.gray); txt('<<', x + s.w / 2, y - 9, C.gold, 1, 1); }
  }
}
function drawMon(m) {
  if (m.dead || m.x + m.w < CX - 20 || m.x > CX + VW + 20) return; if (m.flash > 0 && Math.floor(T * 30) % 2) return;
  const x = Math.round(m.x - CX), y = Math.round(m.y); MONLOOK[m.look](m, x, y);
  const pd = Math.abs(P.x + 5 - (m.x + m.w / 2));
  if (m.type !== 'boss' && (m.hp < m.maxHp || pd < 110)) { const bw = Math.max(12, m.w), bx = Math.round(x + m.w / 2 - bw / 2); R(bx - 1, y - 7, bw + 2, 4, C.ink); R(bx, y - 6, Math.max(0, Math.round((bw * m.hp) / m.maxHp)), 2, C.red); }
  if (m.bug && pd < 90) txt('BUG', x + m.w / 2, y - 15, C.red, 1, 1);
}
function render() {
  ctx.imageSmoothingEnabled = false;
  if (mode === 'flight' && flight) { renderFlight(); return; }
  const cx = Math.round(cam.x); CX = cx; const ws = zoneWeights(cx + VW / 2);
  ws.forEach(([z, w], i) => { ctx.globalAlpha = i ? w : 1; ctx.fillStyle = SKY[ZMAP[z].g]; ctx.fillRect(0, 0, VW, H); }); ctx.globalAlpha = 1;
  let sa = 0; for (const [z, w] of ws) sa += ({ start: 0.55, end: 1, nus: 0.12 }[z] || 0) * w;
  if (sa > 0) for (const s of STARS) { const x = (((s.x - cx * 0.03) % 600) + 600) % 600; if (x >= VW) continue; ctx.globalAlpha = sa * (0.45 + 0.55 * Math.sin(T * 2 + s.p) ** 2); R(x, s.y, s.b ? 2 : 1, s.b ? 2 : 1, '#ffffff'); }
  ctx.globalAlpha = 1;
  for (const [layer, par] of [['far', 0.15], ['mid', 0.45]]) ws.forEach(([z, w], i) => drawTile(LAYER[ZMAP[z].g][layer], par, i ? w : 1, cx));
  ctx.save(); if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 3));
  drawGround(cx);
  const vis = (t) => t.x + t.w > cx - 60 && t.x < cx + VW + 60;
  for (const t of THINGS) if (t.z === 0 && vis(t)) t.draw(Math.round(t.x - cx));
  drawSolids(cx);
  for (const t of THINGS) if (t.z === 1 && vis(t)) t.draw(Math.round(t.x - cx));
  for (const id of WIDS) { if (S.weapons.has(id)) continue; const W = WEAPONS[id]; if (W.x < cx - 40 || W.x > cx + VW + 40) continue; const y = Math.round((W.y ?? GY - 16) + Math.sin(T * 3 + W.x) * 2);
    ctx.globalAlpha = 0.2 + 0.12 * Math.sin(T * 4); R(W.x - cx - 13, y - 9, 26, 18, W.c); ctx.globalAlpha = 1; cart(W.x - cx, y, id); txtS((W.lb || W.n).toUpperCase(), W.x - cx, y - 18, W.c, 1, 1); }
  for (const g of GEMS) if (g.x != null && !S.gems.has(g.id) && g.x > cx - 10 && g.x < cx + VW + 10) { const y = g.y + Math.round(Math.sin(T * 3 + g.x) * 2); drawGem(g.x - cx, y, g.k); }
  for (const d of DROPS) { const x = Math.round(d.x - cx), y = Math.round(d.y + (d.onGround ? Math.sin(T * 4 + d.x) : 0)); if (x < -12 || x > VW + 12) continue;
    if (d.kind === 'proj') drawProjGem(x + 4, y + 2); else if (d.kind === 'gem') drawGem(x + 4, y + 4, GEMBY[d.id].k); else drawCoffee(x + 1, y); }
  for (const m of M) drawMon(m);
  const blink = P.inv > 0 && !P.dead && Math.floor(T * 16) % 2;
  if (!blink) {
    let fr; if (P.dead || !P.onGround) fr = P.vy < 0 ? HERO.jump[0] : HERO.fall[0]; else if (Math.abs(P.vx) > 8) fr = HERO.walk[Math.floor(P.anim / 7) % 4]; else fr = HERO.idle[Math.floor(T * 1.6) % 2];
    ctx.drawImage(fr[P.face > 0 ? 0 : 1], Math.round(P.x - cx - 3), Math.round(P.y - 2));
    if (S.wpn && !P.dead) {
      const W = WEAPONS[S.wpn], hx = Math.round(P.x - cx + (P.face > 0 ? 10 : -2)), hy = Math.round(P.y + 13), aiming = P.atk > 0 || mouseFire, a = aiming && P.aim != null ? P.aim : P.face > 0 ? 0 : Math.PI;
      R(hx - 1, hy - 1, 4, 4, C.ink); R(hx, hy, 3, 2, W.c);
      if (aiming) { L(hx + 1, hy + 1, hx + 1 + Math.cos(a) * 5, hy + 1 + Math.sin(a) * 5, W.c, 2); if (P.atk > 0.07) R(hx + Math.cos(a) * 7, hy + Math.sin(a) * 7 - 1, 3, 3, '#ffffff'); }
    }
  }
  const dx = Math.round(DRONE.x - cx), dy = Math.round(DRONE.y + Math.sin(T * 4) * 2);
  R(dx - 4, dy - 2, 9, 4, C.lgray); R(dx - 3, dy - 3, 7, 1, C.white); R(dx + (P.face > 0 ? 1 : -2), dy - 1, 2, 1, C.cyan); R(dx - 4, dy - 4, 1, 2, C.gray); R(dx + 4, dy - 4, 1, 2, C.gray);
  const pf = Math.floor(T * 20) % 2; R(dx - 6, dy - 5, 4, 1, pf ? C.gray : C.white); R(dx + 3, dy - 5, 4, 1, pf ? C.white : C.gray); R(dx, dy + 2, 1, 1, C.mag);
  for (const s of SHOTS) { const x = Math.round(s.x - cx), y = Math.round(s.y), sg = Math.sign(s.vx) || 1;
    if (s.k === 'dagger') { if (Math.floor(s.t * 30) % 2) { R(x - 3, y, 7, 1, s.c); R(x - 3 * sg, y - 1, 1, 3, C.gold); } else { L(x - 2, y - 2, x + 2, y + 2, s.c); R(x, y, 1, 1, '#ffffff'); } }
    else if (s.k === 'lob') { R(x - 3, y - 3, 6, 6, C.white); R(x - 2, y - 2, 4, 4, C.ink); R(x - 1, y - 1, 1, 1, C.white); R(x + 1, y, 1, 1, C.white); }
    else if (s.pellet) R(x - 1, y - 1, 2, 2, s.c);
    else { const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp; ctx.globalAlpha = 0.5; L(x - ux * 9, y - uy * 9, x - ux * 4, y - uy * 4, s.c); ctx.globalAlpha = 1;
      L(x - ux * 3, y - uy * 3, x + ux * 3, y + uy * 3, s.c, 3); L(x - ux, y - uy, x + ux * 2, y + uy * 2, '#ffffff'); } }
  for (const b of BEAMS) { ctx.globalAlpha = Math.min(1, b.life * 8); dots(b.x0 - cx, b.y0, b.x1 - cx, b.y1, b.c, 2); R(b.x1 - cx - 2, b.y1 - 2, 4, 4, b.c); ctx.globalAlpha = 1; }
  for (const b of EB) { const x = Math.round(b.x - cx), y = Math.round(b.y);
    if (b.k === 'bit') txtS(b.ch, x - 2, y - 3, C.red); else if (b.k === 'z') txt('Z', x - 2, y - 3, '#f7a3c0');
    else if (b.k === 'wave') { R(x - 4, y - 2, 8, 4, C.cyan); R(x - 3, y - 4, 6, 2, '#9fe8f0'); } else { R(x - 2, y - 2, 4, 4, C.orange); R(x - 1, y - 1, 2, 2, C.gold); } }
  for (const p of PS) { if (p.x < cx - 4 || p.x > cx + VW + 4) continue; ctx.globalAlpha = p.k === 'fly' ? 0.35 + 0.65 * Math.abs(Math.sin(T * 3 + p.seed)) : Math.min(1, (p.life / p.max) * 2); R(p.x - cx, p.y, p.s, p.s, p.c); }
  ctx.globalAlpha = 1;
  for (const f of FT) { ctx.globalAlpha = Math.min(1, f.life * 2); txtS(f.s, f.x - cx, f.y, f.c, 1, 1); } ctx.globalAlpha = 1;
  const boss = M.find((m) => m.type === 'boss' && !m.dead && m.x > cx - 40 && m.x < cx + VW + 40);
  if (boss && mode === 'play') { const w = 120, x = Math.round(VW / 2 - w / 2), y = H - 16; txtS('PYRAMID GOLEM', VW / 2, y - 10, C.cyan, 1, 1); R(x - 1, y - 1, w + 2, 6, C.ink); R(x, y, Math.round((w * boss.hp) / boss.maxHp), 4, C.red); R(x, y, Math.round((w * boss.hp) / boss.maxHp), 1, '#f07a6a'); }
  ctx.restore();
  const tgt = mode === 'play' && !P.dead ? near || hover : null;
  if (tgt) { const bx = Math.round(tgt.x + tgt.w / 2 - cx), by = Math.max(10, Math.round(tgt.y - 12 + Math.sin(T * 5))); R(bx - 6, by - 6, 13, 12, C.ink); R(bx - 5, by - 5, 11, 10, tgt === near ? C.gold : C.white); txt(IS_TOUCH ? 'B' : 'E', bx + 1, by - 3, C.ink, 1, 1); R(bx - 1, by + 6, 3, 2, C.ink); showTag(tgt, bx, by - 8); }
  else if (mode === 'play' && !P.dead) { const m = nearestMon(P.x + 5, P.y + 11, 110); if (m) monTag(m, Math.round(m.x + m.w / 2 - cx), Math.round(m.y - 10)); else hideTag(); }
  else hideTag();
  if (hudDirty) updateHUD();
}
function cloud(x, y, s, l) { const c = ['#c9bfd9', '#e6dcea', '#ffffff'][l]; R(x, y, 30 * s, 6 * s, c); R(x + 6 * s, y - 5 * s, 16 * s, 6 * s, c); R(x + 12 * s, y - 8 * s, 10 * s, 4 * s, c); }
function renderFlight() {
  const k = clamp(flight.t / FLIGHT_DUR, 0, 1), a = flight.dir > 0 ? 'air' : 'nus', b = flight.dir > 0 ? 'nus' : 'air', d = flight.dir;
  ctx.fillStyle = SKY[a]; ctx.fillRect(0, 0, VW, H); ctx.globalAlpha = k; ctx.fillStyle = SKY[b]; ctx.fillRect(0, 0, VW, H); ctx.globalAlpha = 1;
  R(0, GY + 6, VW, H, '#1f4f6a'); const w = VW + 20;
  for (let i = 0; i < 30; i++) R(((((i * 53 - flight.t * 60 * (1 + (i % 3)) * d) % w) + w) % w) - 10, GY + 10 + ((i * 7) % 28), 6, 1, '#4f8faa');
  const cw = VW + 80; const layer = (l) => { for (let i = 0; i < 6; i++) cloud(((((i * 97 + l * 41 - flight.t * (40 + l * 80) * d) % cw) + cw) % cw) - 40, 30 + l * 46 + ((i * 13) % 30), 1 + l * 0.4, l); };
  layer(0); layer(1);
  const px = Math.round(VW / 2 - 70), py = Math.round(118 + Math.sin(T * 3) * 3);
  if (d > 0) drawPlane(px, py, false); else { ctx.save(); ctx.translate(VW, 0); ctx.scale(-1, 1); drawPlane(px, py, false); ctx.restore(); }
  ctx.globalAlpha = 0.5; for (let i = 0; i < 8; i++) R(((((i * 61 - T * 320 * d) % VW) + VW) % VW), 40 + i * 18, 14, 1, '#ffffff'); ctx.globalAlpha = 1;
  layer(2);
}

// ===================== language & audio =====================
let lang = (() => { const r = store.raw('zh-lang'); if (r === 'zh' || r === 'en') return r; return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'; })();
const u = (k) => U[lang][k];
const tr = (v) => (v && typeof v === 'object' ? v[lang] : v);
const colon = () => (lang === 'zh' ? '：' : ': ');
const IS_TOUCH = (() => { try { return matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && 'ontouchstart' in window); } catch (e) { return false; } })();
const AU = { ctx: null, master: null, sfx: store.get('hzq-sfx', true), music: false, timer: null, step: 0, next: 0 };
function actx() {
  if (!AU.ctx) { try { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; AU.ctx = new A(); AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.7; AU.master.connect(AU.ctx.destination); } catch (e) { return null; } }
  if (AU.ctx.state === 'suspended') AU.ctx.resume().catch(() => {}); return AU.ctx;
}
function note(f, d, type, vol, t, to) {
  const a = AU.ctx; if (!a) return; const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(AU.master); o.start(t); o.stop(t + d + 0.05);
}
function tone(f, d, o = {}) { if (!AU.sfx || !AU.ctx || AU.ctx.state !== 'running') return; note(f, d, o.type || 'square', o.vol || 0.04, AU.ctx.currentTime + (o.delay || 0), o.to); }
const SFX = {
  jump: () => tone(330, 0.12, { to: 620, vol: 0.03 }),
  gem: () => { tone(988, 0.07); tone(1319, 0.14, { delay: 0.07 }); },
  open: () => { tone(523, 0.05, { vol: 0.03 }); tone(784, 0.08, { vol: 0.03, delay: 0.05 }); },
  close: () => tone(392, 0.07, { vol: 0.025 }),
  ach: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { vol: 0.035, delay: i * 0.08 })),
  fanfare: () => [392, 523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.16, { vol: 0.04, delay: i * 0.11 })),
  pop: () => tone(160 + Math.random() * 200, 0.2, { type: 'triangle', to: 60, vol: 0.05 }),
  fly: () => tone(110, 1.8, { type: 'sawtooth', to: 440, vol: 0.018 }),
  shoot: (k) => {
    if (k === 'dagger') tone(1200, 0.05, { type: 'sawtooth', to: 500, vol: 0.02 });
    else if (k === 'fan') tone(700, 0.09, { type: 'sawtooth', to: 260, vol: 0.022 });
    else if (k === 'lob') tone(280, 0.12, { to: 520, vol: 0.03 });
    else if (k === 'snap') tone(1500, 0.07, { type: 'triangle', to: 2600, vol: 0.03 });
    else if (k === 'seek') tone(600, 0.12, { type: 'triangle', to: 950, vol: 0.03 });
    else { tone(880, 0.05, { to: 440, vol: 0.022 }); if (k === 'twin') tone(1100, 0.05, { to: 520, vol: 0.018, delay: 0.03 }); }
  },
  hit: (eff) => (eff ? tone(1200, 0.06, { to: 1800, vol: 0.03 }) : tone(220, 0.05, { to: 160, vol: 0.03 })),
  kill: () => [880, 660, 990, 1320].forEach((f, i) => tone(f, 0.08, { vol: 0.03, delay: i * 0.05 })),
  hurt: () => tone(200, 0.22, { type: 'sawtooth', to: 80, vol: 0.05 }),
  die: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.05, delay: i * 0.14 })),
  heal: () => { tone(660, 0.08, { vol: 0.03 }); tone(990, 0.12, { vol: 0.03, delay: 0.07 }); },
  weapon: () => [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.08, { vol: 0.03, delay: i * 0.05 })),
  stomp: () => tone(150, 0.1, { type: 'triangle', to: 60, vol: 0.05 }),
  spring: () => tone(300, 0.16, { to: 900, vol: 0.03 }),
  eshot: () => tone(500, 0.05, { to: 300, vol: 0.015 }),
  click: () => tone(800, 0.03, { vol: 0.02 }),
};
const LEAD = [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 77, 0, 72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 79, 0, 74, 0, 0, 0];
const BASS = [48, 0, 0, 0, 55, 0, 0, 0, 50, 0, 0, 0, 57, 0, 0, 0, 48, 0, 0, 0, 55, 0, 0, 0, 55, 0, 0, 0, 50, 0, 0, 0];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function musicTick() { const a = AU.ctx; if (!a) return; while (AU.next < a.currentTime + 0.15) { const i = AU.step % 32; if (LEAD[i]) note(mtof(LEAD[i]), 0.16, 'square', 0.016, AU.next); if (BASS[i]) note(mtof(BASS[i]), 0.3, 'triangle', 0.05, AU.next); AU.next += 0.25; AU.step++; } }
function setMusic(on) { clearInterval(AU.timer); AU.timer = null; AU.music = false; if (!on) return; const a = actx(); if (!a) return; AU.music = true; AU.next = a.currentTime + 0.05; AU.step = 0; AU.timer = setInterval(musicTick, 40); }

// ===================== HUD, tags, banner, toasts =====================
let hudDirty = true, hpHurt = 0, lastHud = '', tagKey = '', bannerTimer = 0, bannerZone = null, msgTimer = 0;
const ENTRY_ZONE = {};
function updateHUD() {
  hudDirty = false; const n = ENTRY_IDS.length;
  $('#xpTxt').textContent = `${S.read.size}/${n}`; $('#xpFill').style.width = `${(S.read.size / n) * 100}%`;
  $('#gemTxt').textContent = `${S.gems.size}/${GEMS.length}`; $('#gemFill').style.width = `${(S.gems.size / GEMS.length) * 100}%`;
  const hp = $('#hpBar'); hp.innerHTML = Array.from({ length: P.maxHp }, (_, i) => `<i class="${i < P.hp ? 'on' : ''}"></i>`).join(''); hp.classList.toggle('hurt', hpHurt > 0);
  const W = S.wpn && WEAPONS[S.wpn], c = $('#wCart'); c.textContent = W ? W.code : '--'; c.style.setProperty('--wc', W ? W.c : 'var(--panel-2)');
  $('#wName').textContent = W ? wName(S.wpn) : u('noWeapon'); $('#wslot').classList.toggle('one', S.weapons.size < 2);
  const db = $('#hudDiff'); db.textContent = S.diff === 'normal' ? '' : DF().n[lang]; db.dataset.d = S.diff;
}
function hudTick() {
  if (mode === 'title') return; const z = zoneAt(P.x + 5) || curZone || ZONES[0]; const d = z.id === 'end' ? tr(z.d) : dateAt(P.x);
  const key = z.w + d; if (key !== lastHud) { lastHud = key; $('#hudWorld').textContent = 'WORLD ' + z.w.slice(1); $('#hudDate').textContent = d; }
  if (hpHurt > 0 !== $('#hpBar').classList.contains('hurt')) hudDirty = true;
}
const tagEl = $('#tag');
function placeTag(key, html, bx, by) {
  if (tagKey !== key) { tagEl.innerHTML = html; tagKey = key; } tagEl.hidden = false;
  const gw = VW * SCALE, w = tagEl.offsetWidth; tagEl.style.left = `${clamp(bx * SCALE, w / 2 + 6, gw - w / 2 - 6)}px`; tagEl.style.top = `${Math.max(by * SCALE, tagEl.offsetHeight + 4)}px`;
}
function showTag(t, bx, by) {
  if (!t.tag) { hideTag(); return; } const n = t === near;
  placeTag(`t${THINGS.indexOf(t)}${n ? 'n' : 'h'}${lang}`, (n ? `<kbd>${IS_TOUCH ? 'B' : 'E'}</kbd>` : '') + esc(tr(t.tag)), bx, by);
}
function monTag(m, bx, by) {
  const owned = m.weak.filter((w) => S.weapons.has(w)), holding = m.weak.includes(S.wpn);
  const weak = m.weak.length ? `${esc(u('weakTo'))}${colon()}${m.weak.map((w) => `<b class="${S.weapons.has(w) ? 'own' : ''}">${esc(wName(w))}</b>`).join(' / ')}` : esc(u('anyWeapon'));
  const sw = owned.length && !holding ? ` <kbd>${IS_TOUCH ? '⇄' : 'C'}</kbd>` : '', only = !m.bug && DF().chip === 0 ? ` · <b class="warn">${esc(u('onlyWeak'))}</b>` : '';
  placeTag(`m${m.id}${lang}${S.wpn}${owned.length}${S.diff}`, `<span class="mt">${esc(m.n[lang])}</span> · ${weak}${only}${sw}`, bx, by);
}
function hideTag() { if (!tagEl.hidden) tagEl.hidden = true; tagKey = ''; }
function showBanner(z) {
  const b = $('#banner'); bannerZone = z;
  b.innerHTML = `<span class="bn-w">WORLD ${z.w.slice(1)}</span><strong>${esc(tr(z.n))}</strong><span class="bn-d">${esc(tr(z.d))}</span><span class="bn-tip">${esc(tr(z.tip))}</span>`;
  b.classList.add('show'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('show'), 3200);
}
function showMsg(text, dur) { const el = $('#msg'); el.textContent = text; el.hidden = false; clearTimeout(msgTimer); msgTimer = setTimeout(() => { el.hidden = true; }, dur * 1000); }
function toast(label, title, sub) {
  const box = $('#toasts'), el = document.createElement('div'); el.className = 'toast win sm';
  el.innerHTML = `<div class="t-label">${esc(label)}</div><strong>${esc(title)}</strong>${sub ? `<span>${esc(sub)}</span>` : ''}`;
  box.appendChild(el); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => el.remove(), 3400);
}
function unlock(id) { if (S.ach.has(id)) return; S.ach.add(id); const a = ACH.find((x) => x.id === id); if (a) toast(u('achGot'), a[lang][0], a[lang][1]); SFX.ach(); save(); }

// ===================== dialog =====================
const dlg = $('#dlg'); let curDlg = null, dlgMon = null;
const entryTitle = (id) => { const e = ENTRY[id][lang]; return e.t || e.lead; };
function bulletsHTML(list) { return `<ul class="bul">${list.map((b, i) => `<li style="animation-delay:${i * 70}ms">${Array.isArray(b) ? `<b>${esc(b[0])}</b>${colon()}${esc(b[1])}` : esc(b)}</li>`).join('')}</ul>`; }
function chartHTML() {
  return `<div class="chart" role="img" aria-label="${esc(u('chartCap'))}: 46.7% → 68.3%"><div class="chart-row"><span>${esc(u('chartBefore'))}</span><i><b style="width:46.7%"></b></i><em>46.7%</em></div>`
    + `<div class="chart-row on"><span>${esc(u('chartAfter'))}</span><i><b style="width:68.3%"></b></i><em>68.3%</em></div><p class="chart-cap">${esc(u('chartCap'))}</p></div>`;
}
function gemGridHTML() { return `<ul class="gemgrid">${GEMS.map((g) => `<li class="${S.gems.has(g.id) ? 'got' : ''}"><span class="gem-ic k-${g.k}"></span>${esc(lang === 'zh' && g.zh ? g.zh : g.n)}</li>`).join('')}</ul>`; }
function contactHTML() {
  return `<div class="copyrow"><code>${EMAIL}</code><button class="pbtn" type="button" data-act="copy">${esc(u('copyEmail'))}</button>`
    + (TOP_LEVEL ? `<a class="pbtn" href="mailto:${EMAIL}">Email</a><a class="pbtn" href="tel:${PHONE_TEL}">${lang === 'zh' ? '电话' : 'Call'}</a><a class="pbtn pri" href="${CV_FILES[lang]}" download>${esc(u('dlCV'))}</a>` : '') + '</div>';
}
function renderDialog() {
  const E = ENTRY[curDlg], e = E[lang], par = E.parent ? ENTRY[E.parent][lang] : null, meta = par ? par.m : e.m;
  let h = dlgMon ? `<p class="dlg-cleared t-label">★ ${esc(u('cleared'))} · ${esc(dlgMon.n[lang])}</p>` : '';
  h += `<div class="dlg-head"><span class="chip t-label c-${E.sec}">${esc(SEC[E.sec][lang])}</span>${meta ? `<span class="dlg-meta">${esc(meta)}</span>` : ''}</div>`;
  h += par ? `<p class="dlg-ctx">${esc(par.t)}</p><h2 id="dlgTitle">${esc(e.lead)}</h2>` : `<h2 id="dlgTitle">${esc(e.t)}</h2>${e.s ? `<p class="dlg-sub">${esc(e.s)}</p>` : ''}`;
  if (e.b && e.b.length) h += bulletsHTML(e.b);
  if (E.chart) h += chartHTML(); if (E.gems) h += gemGridHTML(); if (E.contact) h += contactHTML();
  if (e.h) h += `<p class="dlg-hint">${esc(e.h)}</p>`;
  h += `<div class="dlg-foot"><button class="lnk" type="button" data-act="toResume">${esc(u('viewInResume'))}</button><button class="pbtn pri" type="button" data-act="closeDlg">${esc(IS_TOUCH ? u('close') : u('closeKey'))}</button></div>`;
  dlg.innerHTML = h;
}
function openDialog(id, mon) {
  if (!ENTRY[id]) return; curDlg = id; dlgMon = mon || null; mode = 'dialog'; renderDialog(); dlg.hidden = false; dlg.scrollTop = 0; hideTag(); SFX.open();
  try { dlg.focus({ preventScroll: true }); } catch (e) { /* focus unsupported */ }
  if (!S.read.has(id)) {
    S.read.add(id); floatText('+EXP', P.x + 5, P.y - 10, C.gold); hudDirty = true;
    if (id === 'scholar' && chestThing) puff(chestThing.x + 9, GY - 16, 14, [C.gold, '#fff1a8'], { burst: 60, life: 0.7, g: 140 });
    unlock('hello'); if (S.read.size >= ENTRY_IDS.length) unlock('all'); save();
  }
}
function blurActive() { const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur(); }
function closeDialog() { dlg.hidden = true; curDlg = null; dlgMon = null; if (mode === 'dialog') mode = 'play'; SFX.close(); blurActive(); }

// ===================== menu =====================
let menuTab = 'resume', menuReturn = 'play';
function openMenu(tab) {
  if (mode !== 'menu') menuReturn = mode === 'title' ? 'title' : 'play';
  if (mode === 'dialog') { dlg.hidden = true; curDlg = null; dlgMon = null; }
  mode = 'menu'; $('#menu').hidden = false; hideTag(); setTab(tab || menuTab);
}
function closeMenu() { $('#menu').hidden = true; mode = menuReturn; blurActive(); }
function setTab(tab) {
  menuTab = tab; $$('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  const body = $('#menuBody'); body.innerHTML = { resume: resumeHTML, map: mapHTML, skills: skillsHTML, help: helpHTML }[tab](); body.scrollTop = 0;
}
function entryHTML(id, subs) {
  const e = ENTRY[id][lang], ids = [id, ...(subs || [])], got = ids.filter((x) => S.read.has(x)).length;
  const bl = [...(e.b || [])]; for (const s of subs || []) { const se = ENTRY[s][lang]; bl.push([se.lead, se.b[0]]); }
  const st = got === ids.length ? `<span class="ok">✓ ${esc(u('found'))}</span>` : `<span>${got ? `${esc(u('found'))} ${got}/${ids.length}` : esc(u('notFound'))}</span>`;
  return `<article class="r-entry"><div class="r-top"><h4>${esc(e.t)}</h4>${e.m ? `<span class="r-date">${esc(e.m)}</span>` : ''}</div>${e.s ? `<p class="r-sub">${esc(e.s)}</p>` : ''}`
    + `${bl.length ? bulletsHTML(bl) : ''}${ENTRY[id].chart ? chartHTML() : ''}<div class="r-meta">${st}<button class="lnk" type="button" data-act="go" data-id="${id}">${esc(u('findInGame'))}</button></div></article>`;
}
function resumeHTML() {
  const i = ENTRY.intro[lang];
  let h = `<section class="r-card"><h2>${esc(u('name'))}</h2><p class="r-tagline">${esc(u('profileLine'))}</p>`
    + `<div class="r-contact"><span><b>${EMAIL}</b></span><span><b>${PHONE}</b></span><span>${esc(u('loc'))}</span></div><p>${esc(i.b.join(lang === 'zh' ? '' : ' '))}</p>`
    + `<div class="r-actions"><button class="pbtn" type="button" data-act="copy">${esc(u('copyEmail'))}</button>`
    + (TOP_LEVEL ? `<a class="pbtn pri" href="${CV_FILES[lang]}" download>${esc(u('dlCV'))}</a>${SITE_HOME ? `<a class="pbtn" href="${SITE_HOME}">${esc(u('backSite'))}</a>` : ''}` : '') + '</div></section>';
  for (const [sec, items] of RESUME) { h += `<section class="r-sec"><h3 class="t-label">${esc(SEC[sec][lang])}</h3>`; for (const [id, subs] of items) h += entryHTML(id, subs); h += '</section>'; }
  return h;
}
function mapHTML() {
  const strip = ZONES.map((z) => `<i style="left:${(z.x0 / WORLD_W) * 100}%;width:${((z.x1 - z.x0) / WORLD_W) * 100}%"></i>`).join('') + `<b style="left:${(P.x / WORLD_W) * 100}%"></b>`;
  return `<div class="strip" aria-hidden="true">${strip}</div><ul class="zones">${ZONES.map((z) => {
    const ids = ENTRY_IDS.filter((id) => ENTRY_ZONE[id] === z.id), got = ids.filter((id) => S.read.has(id)).length, here = menuReturn !== 'title' && curZone === z;
    const mons = MONSTERS.filter((m) => zoneAt(m.x) === z), kills = mons.filter((m) => S.killed.has(m.id)).length;
    return `<li class="zone${here ? ' here' : ''}"><span class="t-label">WORLD ${z.w.slice(1)}${here ? ' · ' + esc(u('here')) : ''}</span><strong>${esc(tr(z.n))}</strong><span class="zd">${esc(tr(z.d))}</span>`
      + `<span class="zc">${esc(u('explored'))} ${got}/${ids.length}${mons.length ? ` · ${esc(u('bestiary'))} ${kills}/${mons.length}` : ''}</span><button class="pbtn" type="button" data-act="warp" data-z="${z.id}">${esc(u('go'))}</button></li>`;
  }).join('')}</ul>`;
}
function skillsHTML() {
  const kills = MONSTERS.filter((m) => S.killed.has(m.id)).length;
  return `<h3 class="t-label" style="color:var(--mag);margin:0">${esc(u('gemsTitle'))} · ${S.gems.size}/${GEMS.length}</h3>${gemGridHTML()}`
    + `<h3 class="t-label" style="color:var(--mag);margin:26px 0 0">${esc(u('arsenal'))} · ${S.weapons.size}/${WIDS.length}</h3><ul class="gemgrid">${WIDS.map((id) => `<li class="${S.weapons.has(id) ? 'got' : ''}"><span class="wcart sm" style="--wc:${S.weapons.has(id) ? WEAPONS[id].c : 'var(--panel-2)'}">${esc(WEAPONS[id].code)}</span>${esc(wName(id))}</li>`).join('')}</ul>`
    + `<h3 class="t-label" style="color:var(--mag);margin:26px 0 0">${esc(u('bestiary'))} · ${kills}/${MONSTERS.length}</h3><ul class="achs">${MONSTERS.map((m) => `<li class="${S.killed.has(m.id) ? 'got' : ''}"><strong>${esc(m.n[lang])} · ${esc(S.killed.has(m.id) ? u('defeated') : u('notDefeated'))}</strong>${esc(entryTitle(m.entry))}<br>${esc(u('weakTo'))}${colon()}${esc(m.weak.map(wName).join(' / '))}</li>`).join('')}</ul>`
    + `<h3 class="t-label" style="color:var(--mag);margin:26px 0 0">${esc(u('achTitle'))} · ${S.ach.size}/${ACH.length}</h3><ul class="achs">${ACH.map((a) => `<li class="${S.ach.has(a.id) ? 'got' : ''}"><strong>${esc(a[lang][0])}</strong>${esc(S.ach.has(a.id) ? a[lang][1] : u('locked'))}</li>`).join('')}</ul>`;
}
function helpHTML() {
  const onoff = (v) => esc(v ? u('on') : u('off'));
  return `<h3 class="t-label" style="color:var(--mag);margin:0">${esc(u('keysTitle'))}</h3><div class="help">${U[lang].keys.map(([k, v]) => `<kbd>${esc(k)}</kbd><span>${esc(v)}</span>`).join('')}</div>`
    + `<h3 class="t-label" style="color:var(--mag);margin:0">${esc(u('touchTitle'))}</h3><p style="margin:8px 0 22px;max-width:60ch">${esc(u('touchHelp'))}</p>`
    + `<div class="setrow"><span>${esc(u('diffLbl'))}</span>${diffSegHTML()}</div><p class="diffd">${esc(DF().d[lang])}</p>`
    + `<div class="setrow"><span>${esc(u('rematch'))}</span><button class="pbtn" type="button" data-act="rematch">${esc(u('rematch'))}</button><small>${esc(u('rematchHint'))}</small></div>`
    + `<div class="setrow"><span>${esc(u('sfx'))}</span><button class="pbtn${AU.sfx ? ' pri' : ''}" type="button" data-act="sfx">${onoff(AU.sfx)}</button></div>`
    + `<div class="setrow"><span>${esc(u('music'))}</span><button class="pbtn${AU.music ? ' pri' : ''}" type="button" data-act="music">${onoff(AU.music)}</button></div>`
    + `<div class="setrow"><span>${esc(u('language'))}</span><button class="pbtn${lang === 'zh' ? ' pri' : ''}" type="button" data-act="lang" data-l="zh">中文</button><button class="pbtn${lang === 'en' ? ' pri' : ''}" type="button" data-act="lang" data-l="en">English</button></div>`
    + `<div class="setrow"><span>${esc(u('progress'))}</span><button class="pbtn mag" type="button" data-act="reset">${esc(u('resetBtn'))}</button></div>`;
}

// ===================== ending =====================
function openEnding() {
  mode = 'ending'; hideTag(); const t = Math.round(S.time), kills = MONSTERS.filter((m) => S.killed.has(m.id)).length;
  $('#endBox').innerHTML = `<p class="t-label" style="color:var(--gold);margin:0">${esc(u('endKicker'))}</p><h2>${esc(u('endTitle'))}</h2><p>${esc(u('endSub'))}</p>`
    + `<div class="end-stats"><div><b>${S.read.size}/${ENTRY_IDS.length}</b>${esc(u('stEntries'))}</div><div><b>${kills}/${MONSTERS.length}</b>${esc(u('stKills'))}</div><div><b>${S.gems.size}/${GEMS.length}</b>${esc(u('stGems'))}</div>`
    + `<div><b>${S.ach.size}/${ACH.length}</b>${esc(u('stAch'))}</div><div><b>${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</b>${esc(u('stTime'))}</div><div><b>${esc(DF().n[lang])}</b>${esc(u('diffLbl'))}</div></div>`
    + `<div class="end-card"><strong>${esc(u('name'))} · ${lang === 'zh' ? 'Haodong Zou' : '邹浩东'}</strong><span>${esc(u('profileLine'))}</span><span>${PHONE}</span>${contactHTML()}</div>`
    + `<div class="t-btns" style="margin-top:0"><button class="pbtn pri" type="button" data-act="keep">${esc(u('keepExploring'))}</button><button class="pbtn" type="button" data-act="fullResume">${esc(u('fullResume'))}</button><button class="pbtn" type="button" data-act="again">${esc(u('playAgain'))}</button></div>`;
  $('#ending').hidden = false;
}
function closeEnding() { $('#ending').hidden = true; mode = 'play'; blurActive(); }

// ===================== save, language, start =====================
const SAVE = 'hzq-save-v2';
function save() {
  if (mode === 'title') return;
  store.set(SAVE, { read: [...S.read], gems: [...S.gems], ach: [...S.ach], weapons: [...S.weapons], killed: [...S.killed], wpn: S.wpn, time: Math.round(S.time), flag: S.flag === 2 ? 2 : 0, x: Math.round(P.x), cp: S.cp, diff: S.diff, best: S.best });
}
let savedX = null;
function load() {
  const d = store.get(SAVE, null) || store.get('hzq-save-v1', null); if (!d || typeof d !== 'object') return;
  (d.read || []).forEach((x) => ENTRY[x] && S.read.add(x)); (d.gems || []).forEach((x) => GEMBY[x] && S.gems.add(x)); (d.ach || []).forEach((x) => ACH.some((a) => a.id === x) && S.ach.add(x));
  (d.weapons || []).forEach((x) => WEAPONS[x] && S.weapons.add(x)); (d.killed || []).forEach((x) => MONBY[x] && S.killed.add(x));
  S.wpn = WEAPONS[d.wpn] && S.weapons.has(d.wpn) ? d.wpn : [...S.weapons][0] || null;
  S.diff = DIFF[d.diff] ? d.diff : d.god ? 'story' : 'normal';
  if (d.best && typeof d.best === 'object') for (const k in d.best) if (MONBY[k]) S.best[k] = +d.best[k];
  S.time = +d.time || 0; S.flag = d.flag === 2 ? 2 : 0; if (S.killed.has('m_golem')) SC_K = 1;
  if (d.weapons && typeof d.x === 'number' && d.x > 0 && d.x < WORLD_W - 20 && (d.x < GAP0 - 20 || d.x > GAP1 + 10)) savedX = d.x;
  if (typeof d.cp === 'number') S.cp = d.cp;
}
function resetProgress() {
  for (const k of ['read', 'gems', 'ach', 'weapons', 'killed']) S[k].clear();
  Object.assign(S, { wpn: null, time: 0, flag: 0, flagK: 0, cp: 40, best: {} }); SC_K = 0; savedX = null; store.del(SAVE); store.del('hzq-save-v1');
  DROPS.length = 0; SHOTS.length = 0; EB.length = 0; spawnMonsters(); P.hp = P.maxHp; P.dead = false; hudDirty = true;
}
const hasProgress = () => S.read.size + S.gems.size + S.weapons.size > 0;
function setDiff(d, announce) {
  if (!DIFF[d]) return; S.diff = d; P.maxHp = DIFF[d].hp; P.hp = P.maxHp;
  for (const m of M) { m.maxHp = Math.max(1, Math.round((m.bug ? 2 : MONBY[m.id].hp) * DIFF[d].monHp)); if (!m.dead) m.hp = m.maxHp; }
  hudDirty = true; save(); renderTitleDiff(); if (announce) toast(u('diffSet'), DIFF[d].n[lang], DIFF[d].d[lang]);
}
function rematch() { S.killed.clear(); spawnMonsters(); EB.length = 0; SHOTS.length = 0; SC_K = 0; hudDirty = true; save(); }
const diffSegHTML = () => `<div class="seg" role="radiogroup">${DIFFS.map((d) => `<button type="button" class="segb${S.diff === d ? ' on' : ''}" role="radio" aria-checked="${S.diff === d}" data-act="diff" data-d="${d}">${esc(DIFF[d].n[lang])}</button>`).join('')}</div>`;
function renderTitleDiff() { const el = $('#tDiff'); if (!el) return; el.innerHTML = diffSegHTML(); $('#tDiffD').textContent = DF().d[lang]; }
function applyStatic() {
  $$('[data-k]').forEach((el) => { const v = U[lang][el.dataset.k]; if (typeof v === 'string') el.textContent = v; });
  $('#bLang').textContent = lang === 'zh' ? 'EN' : '中文'; $('#btLang').textContent = lang === 'zh' ? 'English' : '中文';
  $('#tKeys').textContent = IS_TOUCH ? u('tKeysTouch') : u('tKeys'); $('.t-blink').textContent = IS_TOUCH ? 'TAP START' : 'PRESS ENTER';
  $('#bSound').textContent = AU.sfx ? u('soundOn') : u('soundOff'); $('#bSound').classList.toggle('on', AU.sfx);
  $('#btStart').textContent = hasProgress() ? u('tContinue') : u('tStart'); $('#btNew').hidden = !hasProgress();
  $('#wslot kbd').textContent = IS_TOUCH ? '⇄' : 'C'; renderTitleDiff();
  cv.setAttribute('aria-label', lang === 'zh' ? '像素游戏画面：邹浩东的简历世界' : 'Pixel game scene: Haodong Zou’s résumé world');
  hudDirty = true;
}
function setLang(l) {
  lang = l; store.setRaw('zh-lang', l); document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'; applyStatic(); lastHud = ''; tagKey = '';
  if (curDlg) renderDialog(); if (mode === 'menu') setTab(menuTab); if (mode === 'ending') openEnding();
  if (flight) $('#flyRoute').textContent = flight.dir > 0 ? u('flightTo') : u('flightBack');
  if (bannerZone && $('#banner').classList.contains('show')) showBanner(bannerZone);
}
function enterPlay() { $('#title').hidden = true; $('#hud').hidden = false; if (mode === 'title') mode = 'play'; hudDirty = true; blurActive(); }
function startGame(fresh) { if (fresh) resetProgress(); actx(); mode = 'play'; enterPlay(); teleport(!fresh && savedX ? savedX : 40); }
function warpTo(zid) { const z = ZMAP[zid]; if (!z) return; $('#menu').hidden = true; mode = 'play'; enterPlay(); teleport(z.cp); S.cp = z.cp; }
function goTo(id) {
  const mon = MONSTERS.find((m) => m.entry === id), t = THINGS.find((x) => x.entry === id);
  const c = mon ? mon.x + mon.w / 2 : t ? (t.bot ? t.bot.x : t.x + t.w / 2) : null; if (c == null) return;
  let x = clamp(c - (mon ? 60 : 30), 20, WORLD_W - 40); if (x > GAP0 - 30 && x < GAP1 + 16) x = ZMAP.nus.cp;
  $('#menu').hidden = true; mode = 'play'; enterPlay(); teleport(x); P.face = 1; const z = zoneAt(x); if (z) S.cp = z.cp;
}
function copyEmail(btn) {
  const done = (ok) => toast(lang === 'zh' ? '邮箱' : 'Email', ok ? u('copied') : u('copyFail'), EMAIL);
  const fallback = () => { const code = btn.parentElement && btn.parentElement.querySelector('code'); if (code) { const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } done(false); };
  try { navigator.clipboard.writeText(EMAIL).then(() => done(true), fallback); } catch (e) { fallback(); }
}

// ===================== input =====================
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyK: 'jump', ArrowDown: 'down', KeyS: 'down',
  KeyJ: 'atk', KeyX: 'atk', KeyF: 'atk', KeyC: 'swap', KeyE: 'act', Enter: 'act', NumpadEnter: 'act', ShiftLeft: 'run', ShiftRight: 'run', KeyQ: 'resume', KeyM: 'map', Escape: 'esc', KeyP: 'esc', KeyL: 'lang' };
addEventListener('keydown', (e) => {
  const a = KEYMAP[e.code]; if (!a || e.ctrlKey || e.metaKey || e.altKey) return;
  const onCtl = e.target && e.target.closest && e.target.closest('button, a, input, textarea, select');
  if (onCtl && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) return;
  if (mode === 'menu' || mode === 'ending') { if (a === 'esc' || a === 'resume' || a === 'map' || a === 'lang') { e.preventDefault(); if (!e.repeat) pressed.add(a); } return; }
  if (mode === 'dialog' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyA', 'KeyD', 'KeyS'].includes(e.code)) return;
  e.preventDefault(); K[a] = true; if (!e.repeat) pressed.add(a); actx();
});
addEventListener('keyup', (e) => { const a = KEYMAP[e.code]; if (a) K[a] = false; });
addEventListener('blur', () => { for (const k in K) K[k] = false; mouseFire = false; });
$$('#pad button').forEach((b) => {
  const k = b.dataset.key;
  const down = (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } K[k] = true; pressed.add(k); b.classList.add('down'); actx(); };
  const up = () => { K[k] = false; b.classList.remove('down'); };
  b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up); b.addEventListener('contextmenu', (e) => e.preventDefault());
});
function worldAt(e) { const r = cv.getBoundingClientRect(); return [cam.x + ((e.clientX - r.left) / r.width) * VW, ((e.clientY - r.top) / r.height) * H]; }
function thingAt(wx, wy) { for (let i = THINGS.length - 1; i >= 0; i--) { const t = THINGS[i]; if ((t.entry || t.action) && wx >= t.x - 3 && wx <= t.x + t.w + 3 && wy >= t.y - 6 && wy <= t.y + t.h + 2) return t; } return null; }
// Mouse / finger: press to shoot toward the pointer (hold to keep firing); pressing an object that has no monster on it opens the object.
let mouseFire = false, ptr = null;
function monAt(wx, wy) { for (const m of M) if (!m.dead && wx >= m.x - 6 && wx <= m.x + m.w + 6 && wy >= m.y - 6 && wy <= m.y + m.h + 6) return m; return null; }
cv.addEventListener('pointerdown', (e) => {
  if (mode !== 'play' || P.dead || e.button > 0) return; actx(); e.preventDefault();
  const [x, y] = worldAt(e), t = monAt(x, y) ? null : thingAt(x, y);
  if (t) { P.face = t.x + t.w / 2 > P.x ? 1 : -1; interact(t); return; }
  ptr = { clientX: e.clientX, clientY: e.clientY }; mouseFire = true; try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  attack({ x, y });
});
cv.addEventListener('pointermove', (e) => {
  if (mouseFire) ptr = { clientX: e.clientX, clientY: e.clientY };
  if (mode !== 'play' || e.pointerType === 'touch') { hover = null; return; } const [x, y] = worldAt(e); hover = monAt(x, y) ? null : thingAt(x, y); cv.classList.toggle('hover', !!hover);
});
const stopFire = () => { mouseFire = false; };
cv.addEventListener('pointerup', stopFire); cv.addEventListener('pointercancel', stopFire); cv.addEventListener('lostpointercapture', stopFire);
cv.addEventListener('pointerleave', () => { hover = null; cv.classList.remove('hover'); });
const hb = (id, fn) => $(id).addEventListener('click', (e) => { fn(); e.currentTarget.blur(); });
hb('#bResume', () => openMenu('resume')); hb('#bMap', () => openMenu('map')); hb('#bSkills', () => openMenu('skills')); hb('#bMenu', () => openMenu('help'));
hb('#bLang', () => setLang(lang === 'zh' ? 'en' : 'zh'));
hb('#bSound', () => { AU.sfx = !AU.sfx; store.set('hzq-sfx', AU.sfx); if (AU.sfx) actx(); applyStatic(); });
hb('#wslot', () => { if (mode === 'play') cycleWeapon(); });
$('#btStart').addEventListener('click', () => startGame(false));
$('#btNew').addEventListener('click', () => startGame(true));
$('#btQuick').addEventListener('click', () => openMenu('resume'));
$('#btLang').addEventListener('click', () => setLang(lang === 'zh' ? 'en' : 'zh'));
$('#menuClose').addEventListener('click', closeMenu);
$('#menu').addEventListener('click', (e) => { if (e.target.id === 'menu') closeMenu(); });
$$('.tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
  if (a === 'closeDlg') closeDialog(); else if (a === 'toResume') { closeDialog(); openMenu('resume'); }
  else if (a === 'copy') copyEmail(b); else if (a === 'go') goTo(b.dataset.id); else if (a === 'warp') warpTo(b.dataset.z);
  else if (a === 'keep') closeEnding(); else if (a === 'fullResume') { $('#ending').hidden = true; mode = 'play'; openMenu('resume'); }
  else if (a === 'again') { closeEnding(); teleport(40); S.cp = 40; }
  else if (a === 'diff') { setDiff(b.dataset.d, mode !== 'title' && menuReturn !== 'title'); if (mode === 'menu') setTab('help'); }
  else if (a === 'rematch') { if (b.dataset.armed) { rematch(); toast(u('rematch'), u('rematchDone')); setTab('help'); } else { b.dataset.armed = '1'; b.textContent = u('rematchConfirm'); } }
  else if (a === 'sfx') { AU.sfx = !AU.sfx; store.set('hzq-sfx', AU.sfx); if (AU.sfx) actx(); applyStatic(); setTab('help'); }
  else if (a === 'music') { setMusic(!AU.music); setTab('help'); }
  else if (a === 'lang') setLang(b.dataset.l);
  else if (a === 'reset') { if (b.dataset.armed) { resetProgress(); applyStatic(); toast(u('progress'), u('resetDone')); teleport(40); setTab('help'); } else { b.dataset.armed = '1'; b.textContent = u('resetConfirm'); } }
});

// ===================== layout & loop =====================
function layout() {
  const app = $('#app'), vw = app.clientWidth, vh = app.clientHeight, portrait = vh > vw * 1.05;
  let aw = vw, ah = vh; if (portrait) ah = Math.min(vh - (IS_TOUCH ? 190 : 0), Math.round(vw * 0.95)); ah = Math.max(160, ah);
  VW = clamp(Math.round((H * aw) / ah), 256, 560); let sc = ah / H; if (VW * sc > aw) sc = aw / VW;
  SCALE = sc; cv.width = VW; cv.height = H; ctx.imageSmoothingEnabled = false;
  const g = $('#game'); g.style.width = `${Math.round(VW * sc)}px`; g.style.height = `${Math.round(H * sc)}px`;
  document.documentElement.style.setProperty('--s', sc.toFixed(3)); app.classList.toggle('portrait', portrait); $('#pad').hidden = !IS_TOUCH; updateCamera(0, true);
}
let last = performance.now(), acc = 0; const DT = 1 / 60;
function frame(now) {
  const el = Math.min(0.1, (now - last) / 1000); last = now; acc += el; let n = 0;
  while (acc >= DT && n < 6) { update(DT); acc -= DT; n++; } if (n === 6) acc = 0;
  render(); hudTick(); requestAnimationFrame(frame);
}
function selftest() {
  const errs = [], log = []; const step = (n) => { for (let i = 0; i < n; i++) { update(DT); render(); hudTick(); } };
  try {
    startGame(true); step(10);
    { // the reported case: mouse press aimed at the first (7 px tall) bug, using the real pointer handlers
      S.diff = 'story'; gainWeapon('python'); const b = M.find((m) => m.id === 'bug0'); teleport(b.x - 60); step(2); const r = cv.getBoundingClientRect(), hp0 = b.hp;
      const at = () => ({ clientX: r.left + ((b.x + b.w / 2 - cam.x) / VW) * r.width, clientY: r.top + ((b.y + b.h / 2) / H) * r.height, button: 0, pointerId: 7, bubbles: true });
      cv.dispatchEvent(new PointerEvent('pointerdown', at())); for (let i = 0; i < 40 && !b.dead; i++) { cv.dispatchEvent(new PointerEvent('pointermove', at())); step(1); }
      cv.dispatchEvent(new PointerEvent('pointerup', at())); log.push('mouse-hit-bug0=' + (b.dead ? 'killed' : b.hp < hp0 ? 'hit' : 'MISS'));
      const b2 = M.find((m) => m.id === 'bug1'); teleport(b2.x - 70); P.face = 1; for (let i = 0; i < 40 && !b2.dead; i++) { P.cd = 0; attack(null); step(4); } log.push('autoaim-bug1=' + (b2.dead ? 'killed' : 'MISS'));
      S.diff = 'normal';
    }
    for (const z of ZONES) { warpTo(z.id); K.right = true; step(70); K.right = false; step(5); }
    S.diff = 'story';
    for (const id of WIDS) { const W = WEAPONS[id]; teleport(W.x - 5); P.y = (W.y ?? GY - 16) - 11; step(2); if (!S.weapons.has(id)) { log.push('miss:' + id); gainWeapon(id); } }
    for (const id of WIDS) { S.wpn = id; P.cd = 0; attack(null); step(25); }
    const tough = [];
    for (const m of M) { if (m.dead) continue; teleport(clamp(m.hx - 50, 20, WORLD_W - 40)); S.wpn = m.weak[0] || 'python'; P.face = 1;
      for (let k = 0; k < 70 && !m.dead; k++) { P.cd = 0; attack(k % 2 ? null : { x: m.x + m.w / 2, y: m.y + m.h / 2 }); step(5); }
      if (!m.dead) { tough.push(m.id); while (!m.dead) damageMon(m, S.wpn, false); } }
    log.push('unhittable=' + (tough.join(',') || 'none'));
    step(60);
    for (let k = 0; k < 80 && DROPS.length; k++) { if (mode === 'dialog') closeDialog(); const d = DROPS[0]; P.x = d.x; P.y = d.y - 10; d.t = 1; step(3); if (mode === 'dialog') closeDialog(); }
    for (const id of ENTRY_IDS) { openDialog(id); step(2); closeDialog(); }
    for (const t of ['resume', 'map', 'skills', 'help']) { openMenu(t); step(1); } closeMenu();
    setLang(lang === 'zh' ? 'en' : 'zh'); openMenu('skills'); step(1); closeMenu(); openDialog('thesis'); closeDialog(); setLang(lang === 'zh' ? 'en' : 'zh');
    S.diff = 'normal'; P.hp = P.maxHp; teleport(1110); P.x = 1150; P.y = GY - 40; P.vx = 0; step(90); log.push('pit hp=' + P.hp);
    P.inv = 0; hurtPlayer(9, P.x + 20); step(110); log.push('respawn hp=' + P.hp + ' dead=' + P.dead);
    teleport(3530); K.right = true; step(30); K.right = false; step(60); log.push('spring y=' + Math.round(P.y));
    teleport(5030); K.right = true; step(60); K.right = false; log.push('boat x=' + Math.round(P.x));
    warpTo('air'); startFlight(1); step(240); startFlight(-1); step(240);
    warpTo('end'); teleport(6680); K.right = true; step(30); K.right = false; step(260);
    openEnding(); step(2); closeEnding(); goTo('nus_fr3'); step(5);
    { // difficulty: hardcore = 4 HP, hits cost 2, off-weapons resisted; rematch revives every project monster
      const killedBefore = new Set(S.killed); setDiff('hardcore'); rematch(); const alive = M.filter((m) => !m.bug && !m.dead).length;
      const g = M.find((m) => m.id === 'm_maze'), hp0 = g.hp; damageMon(g, 'python', false); const resisted = g.hp === hp0; damageMon(g, 'simulink', false);
      teleport(800); P.inv = 0; const h0 = P.hp; hurtPlayer(1, P.x + 20);
      log.push(`hardcore maxHp=${P.maxHp} hit=-${h0 - P.hp} resist=${resisted} eff=-${hp0 - g.hp} mazeHp=${g.maxHp} revived=${alive}`);
      P.inv = 0; teleport(2420); step(240); teleport(1580); step(150); log.push(`hardcore-run hp=${P.hp} dead=${P.dead}`);
      setDiff('hard'); log.push(`hard maxHp=${P.maxHp} mazeHp=${g.maxHp}`);
      S.killed = killedBefore; spawnMonsters(); setDiff('normal');
    }
  } catch (e) { errs.push(String((e && e.stack) || e)); }
  const kills = MONSTERS.filter((m) => S.killed.has(m.id)).length;
  document.body.setAttribute('data-selftest', (errs.length ? 'FAIL ' + errs.join(' | ') : 'OK') + ` read=${S.read.size}/${ENTRY_IDS.length} gems=${S.gems.size}/${GEMS.length} kills=${kills}/${MONSTERS.length} weapons=${S.weapons.size}/${WIDS.length} ach=${S.ach.size}/${ACH.length} | ${log.join(' ; ')}`);
}
window.addEventListener('error', (e) => { document.body.setAttribute('data-errors', (document.body.getAttribute('data-errors') || '') + ' | ' + e.message + ' @' + e.lineno); });

function boot(data) {
  buildWorld(); load(); P.maxHp = DF().hp; P.hp = P.maxHp; spawnMonsters(); restoreDrops(); updateBots(0);
  for (const t of THINGS) if (t.entry && !ENTRY_ZONE[t.entry]) { const z = zoneAt(t.bot ? t.bot.x : t.x + t.w / 2); if (z) ENTRY_ZONE[t.entry] = z.id; }
  for (const m of MONSTERS) { const z = zoneAt(m.x); if (z) ENTRY_ZONE[m.entry] = z.id; }
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'; applyStatic(); layout(); addEventListener('resize', layout); updateHUD();
  $('#hudFace').getContext('2d').drawImage(HERO.idle[0][0], 0, 0, 16, 13, 0, 0, 16, 13);
  const hash = (location.hash || '').slice(1);
  if (data && data.st && data.st.started) { savedX = data.st.x; startGame(false); }
  else if (hash === 'selftest') selftest();
  else if (ZMAP[hash]) warpTo(hash);
  else if (hash === 'resume') openMenu('resume');
  else if (hash === 'play') startGame(false);
  requestAnimationFrame(frame);
}
const hot = window.claude && window.claude.hot;
if (hot && typeof hot.snapshot === 'function') { try { hot.snapshot(() => ({ st: { x: Math.round(P.x), started: mode !== 'title' } })); } catch (e) { /* not available */ } }
if (hot && typeof hot.ready === 'function') hot.ready(boot); else boot((hot && hot.data) || {});
})();
