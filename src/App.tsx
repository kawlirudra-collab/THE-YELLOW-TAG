import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Sliders,
  X,
  Check,
  ShoppingBag,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

// ============================================================================
// CALIBRATION & BAY CONFIGURATION (Micro-adjustable via Shift+D or right here)
// ============================================================================
export interface BayConfig {
  id: '01' | '02' | '03';
  code: string;
  bayLabel: string;
  shortName: string;
  inspectPill: string;
  left: number; // Percentage on 16:9 stage
  top: number;  // Percentage on 16:9 stage
  width: number; // Percentage width on 16:9 stage
  zoomScale: number;
  productImg: string;
  morphImg: string;
  animationType: 'pendulum' | 'pedestal' | 'hover-bob';
  eyebrow: string;
  title: string;
  price: string;
  priceSubtext: string;
  copy: string;
  specs: { label: string; value: string }[];
  archiveSerial: string;
  tariffCode: string;
}

const INITIAL_BAY_CONFIGS: BayConfig[] = [
  {
    id: '01',
    code: '01 // SECURE',
    bayLabel: 'BAY 01 // LEFT BRASS ALCOVE',
    shortName: 'BARE FARE',
    inspectPill: 'INSPECT 01 // BARE FARE — $45',
    left: 17.5,
    top: 52.0,
    width: 13.0,
    zoomScale: 2.65,
    productImg: '/assets/product-tag.png',
    morphImg: '/assets/morph-tag.png',
    animationType: 'pendulum',
    eyebrow: 'BAY 01 // SECURE — ARCHIVE EDITION',
    title: 'The "Bare Fare" Tag',
    price: '$45.00',
    priceSubtext: 'No hidden gate fee. Just the whole fee upfront.',
    copy: 'Turn baggage-fee trauma into half a pound of architectural hardware. Cast in solid 8 oz brass with a deep-fill high-gloss #FFD100 enamel face and braided steel aviation cable. Completely blank. Zero logos. Heavy enough to feel like revenge.',
    specs: [
      { label: 'WEIGHT', value: '8 OZ SOLID BRASS' },
      { label: 'FINISH', value: 'HIGH-GLOSS ENAMEL' },
      { label: 'CLASP', value: 'KNURLED BRASS + STEEL CABLE' },
      { label: 'COMPLIANCE', value: '100% BLANK FACE' },
    ],
    archiveSerial: 'TYT-01-BRS-08OZ',
    tariffCode: 'GATE-SURCHARGE-EXEMPT',
  },
  {
    id: '02',
    code: '02 // TSA 100ML',
    bayLabel: 'BAY 02 // CENTER CERAMIC POD',
    shortName: 'PERSONAL ITEM',
    inspectPill: 'INSPECT 02 // PERSONAL ITEM — $45',
    left: 50.0,
    top: 52.5,
    width: 11.5,
    zoomScale: 2.65,
    productImg: '/assets/product-vessel.png',
    morphImg: '/assets/morph-vessel.png',
    animationType: 'pedestal',
    eyebrow: 'BAY 02 // TSA 100ML — LIQUID HARDWARE',
    title: 'The "Personal Item" Vessel',
    price: '$45.00',
    priceSubtext: 'Fits strictly under the seat in front of you.',
    copy: 'A 100 ml TSA-compliant liquid vessel engineered like a museum object. Glazed off-white ceramic-coated aluminium up top, wrapped in a high-friction matte safety-yellow silicone grip below. Because paying $6 for warm cabin water was the final straw.',
    specs: [
      { label: 'CAPACITY', value: '100 ML (TSA MAX)' },
      { label: 'BODY', value: 'CERAMIC-COATED ALUMINIUM' },
      { label: 'GRIP', value: 'MATTE YELLOW SILICONE' },
      { label: 'STATUS', value: 'CARRY-ON CERTIFIED' },
    ],
    archiveSerial: 'TYT-02-CRM-100ML',
    tariffCode: 'UNDER-SEAT-CLEARANCE',
  },
  {
    id: '03',
    code: '03 // ZONE 4',
    bayLabel: 'BAY 03 // RIGHT CORRUGATED TUNNEL',
    shortName: 'ZONE 4 WALLET',
    inspectPill: 'INSPECT 03 // ZONE 4 — $45',
    left: 82.5,
    top: 57.0,
    width: 15.5,
    zoomScale: 2.65,
    productImg: '/assets/product-wallet.png',
    morphImg: '/assets/morph-wallet.png',
    animationType: 'hover-bob',
    eyebrow: 'BAY 03 // ZONE 4 — BOARDING LAST',
    title: 'The "Zone 4" Wallet',
    price: '$45.00',
    priceSubtext: 'Overhead bin space not guaranteed.',
    copy: 'A compact, rugged hardcase travel wallet machined from corrugated anodised aluminium. Powder-coated in industrial cargo grey with a single aggressive stripe of high-gloss yellow across the blank face. Built for middle seats and zero legroom.',
    specs: [
      { label: 'SHELL', value: 'CORRUGATED ALUMINIUM' },
      { label: 'COAT', value: 'INDUSTRIAL CARGO GREY' },
      { label: 'ACCENT', value: 'HIGH-GLOSS YELLOW STRIPE' },
      { label: 'BOARDING', value: 'ZONE 4 PRIORITY' },
    ],
    archiveSerial: 'TYT-03-ALU-Z4',
    tariffCode: 'BIN-SPACE-UNAVAILABLE',
  },
];

// ============================================================================
// MAIN APPLICATION
// ============================================================================
export default function App() {
  const [bays, setBays] = useState<BayConfig[]>(INITIAL_BAY_CONFIGS);
  const [activeBayId, setActiveBayId] = useState<'01' | '02' | '03' | null>(null);
  const [hoveredBayId, setHoveredBayId] = useState<'01' | '02' | '03' | null>(null);

  // Morph state inside inspection view: 'handler' (morph-*) vs 'object' (product-*)
  const [viewMode, setViewMode] = useState<'handler' | 'object'>('handler');
  // Optical scanner morph sequence phase when opening or switching bays/modes
  const [isScanning, setIsScanning] = useState(false);
  const [morphDisplayMode, setMorphDisplayMode] = useState<'handler' | 'object'>('object');

  // Carry-on bag state
  const [carryOnItems, setCarryOnItems] = useState<{ id: string; title: string; code: string; qty: number }[]>([]);
  const [justAddedToast, setJustAddedToast] = useState<string | null>(null);
  const [carryOnDrawerOpen, setCarryOnDrawerOpen] = useState(false);

  // Fake Buy Now / Gate Checkout Modal state
  const [checkoutBay, setCheckoutBay] = useState<BayConfig | null>(null);
  const [orderStamped, setOrderStamped] = useState(false);

  // "OUR TRAUMA." Left Edge Manifesto Drawer state
  const [traumaDrawerOpen, setTraumaDrawerOpen] = useState(false);

  // Dev Calibrator (Shift + D)
  const [calibratorOpen, setCalibratorOpen] = useState(false);

  const activeBay = bays.find((b) => b.id === activeBayId) || null;
  const totalCarryOnCount = carryOnItems.reduce((sum, item) => sum + item.qty, 0);

  // Track last active bay origin so zoom-out returns smoothly from that exact bay
  const lastOriginRef = useRef<string>('50% 52.5%');
  if (activeBay) {
    lastOriginRef.current = `${activeBay.left}% ${activeBay.top}%`;
  }

  // --------------------------------------------------------------------------
  // 2.5D MOUSE PARALLAX SPRINGS
  // --------------------------------------------------------------------------
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 110, damping: 24, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Facility container tilt: rotateX: ±1.8deg, rotateY: ±2.5deg
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [1.8, -1.8]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-2.5, 2.5]);

  // Foreground product translate offset: ±10px
  const fgTranslateX = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);
  const fgTranslateY = useTransform(smoothY, [-0.5, 0.5], [-10, 10]);

  // Subtle parallax inside inspection showcase stage
  const showcaseX = useTransform(smoothX, [-0.5, 0.5], [-7, 7]);
  const showcaseY = useTransform(smoothY, [-0.5, 0.5], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    // Lock facility parallax when zoomed into a bay, but keep subtle studio float
    if (activeBayId) {
      mouseX.set(nx * 0.65);
      mouseY.set(ny * 0.65);
    } else {
      mouseX.set(nx);
      mouseY.set(ny);
    }
  };

  // --------------------------------------------------------------------------
  // CHOREOGRAPHED SCANNER MORPH SEQUENCE
  // --------------------------------------------------------------------------
  const selectBay = (id: '01' | '02' | '03') => {
    setHoveredBayId(null);
    setActiveBayId(id);
    setViewMode('handler');
    // Start with standalone object briefly, then sweep the yellow laser scan-line to morph into mascot handler!
    setMorphDisplayMode('object');
    setIsScanning(true);
  };

  useEffect(() => {
    if (!activeBayId) {
      setIsScanning(false);
      setMorphDisplayMode('object');
      return;
    }
    const morphTimer = setTimeout(() => {
      setMorphDisplayMode(viewMode);
    }, 240);
    const endScanTimer = setTimeout(() => {
      setIsScanning(false);
    }, 760);
    return () => {
      clearTimeout(morphTimer);
      clearTimeout(endScanTimer);
    };
  }, [activeBayId]);

  const handleToggleViewMode = (targetMode: 'object' | 'handler') => {
    if (targetMode === viewMode) return;
    setViewMode(targetMode);
    setIsScanning(true);
    setTimeout(() => {
      setMorphDisplayMode(targetMode);
    }, 180);
    setTimeout(() => {
      setIsScanning(false);
    }, 680);
  };

  // --------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS (ESC to exit modal/bay, Shift+D for Calibrator, Arrows)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setCalibratorOpen((prev) => !prev);
        return;
      }
      if (e.key === 'Escape') {
        if (checkoutBay) {
          setCheckoutBay(null);
          setOrderStamped(false);
        } else if (traumaDrawerOpen) {
          setTraumaDrawerOpen(false);
        } else if (carryOnDrawerOpen) {
          setCarryOnDrawerOpen(false);
        } else if (activeBayId) {
          setActiveBayId(null);
          mouseX.set(0);
          mouseY.set(0);
        }
      }
      if (activeBayId && !checkoutBay && !traumaDrawerOpen) {
        const order: ('01' | '02' | '03')[] = ['01', '02', '03'];
        const idx = order.indexOf(activeBayId);
        if (e.key === 'ArrowRight') {
          selectBay(order[(idx + 1) % 3]);
        } else if (e.key === 'ArrowLeft') {
          selectBay(order[(idx + 2) % 3]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeBayId, checkoutBay, traumaDrawerOpen, carryOnDrawerOpen]);

  // --------------------------------------------------------------------------
  // CARRY-ON & FAKE BUY NOW HANDLERS
  // --------------------------------------------------------------------------
  const handleAddToCarryOn = (bay: BayConfig) => {
    setCarryOnItems((prev) => {
      const existing = prev.find((i) => i.id === bay.id);
      if (existing) {
        return prev.map((i) => (i.id === bay.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: bay.id, title: bay.title, code: bay.code, qty: 1 }];
    });
    setJustAddedToast(`LOGGED TO CARRY-ON // ${bay.shortName}`);
    setTimeout(() => {
      setJustAddedToast(null);
    }, 2400);
  };

  const handleOpenBuyNow = (bay: BayConfig) => {
    setOrderStamped(false);
    setCheckoutBay(bay);
  };

  const handleCycleBay = (dir: -1 | 1) => {
    if (!activeBayId) return;
    const order: ('01' | '02' | '03')[] = ['01', '02', '03'];
    const idx = order.indexOf(activeBayId);
    const nextId = order[(idx + dir + 3) % 3];
    selectBay(nextId);
  };

  const updateBayCoordinate = (id: '01' | '02' | '03', field: 'left' | 'top' | 'width', value: number) => {
    setBays((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen overflow-hidden bg-[#E5E7EB] text-[#141517] select-none"
      style={{ perspective: '1400px' }}
    >
      {/* Kodak Ektar 100 Film Grain Overlay */}
      <div className="film-grain-overlay" />

      {/* ====================================================================
          1. MINIMAL GLOBAL HUD
          ==================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-7 py-4 sm:py-5 pointer-events-none">
        {/* Top-Left HUD: Minimal wordmark THE YELLOW TAG with tiny #FFD100 status dot (GROUNDED MAY 2026) */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => {
              setActiveBayId(null);
              mouseX.set(0);
              mouseY.set(0);
            }}
            className="group flex items-center gap-3 bg-[#141517] text-[#F6F6F4] px-3.5 py-2 border border-[#141517] shadow-sm transition-colors hover:bg-[#141517]/95 text-left"
          >
            <span className="font-sans font-black tracking-[-0.04em] text-sm sm:text-base uppercase">
              THE YELLOW TAG
            </span>
            <span className="h-3.5 w-[1px] bg-[#F6F6F4]/25" />
            <span className="flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] tracking-widest text-[#F6F6F4]/85">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD100] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD100]" />
              </span>
              GROUNDED MAY 2026
            </span>
          </button>

          <span className="hidden xl:inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#4A4D50] bg-[#F6F6F4]/80 backdrop-blur-sm px-2.5 py-1.5 border border-[#141517]/15">
            ARCHIVE // HARDWARE TEST FACILITY
          </span>
        </div>

        {/* Top-Right HUD: Minimal bay quick-jump pills (01 02 03) + CARRY-ON (0) counter button */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <div className="flex items-center bg-[#F6F6F4]/90 backdrop-blur-md border border-[#141517]/20 p-1 shadow-sm">
            <span className="hidden md:inline-block font-mono text-[10px] tracking-[0.16em] text-[#4A4D50] px-2.5">
              BAY
            </span>
            {bays.map((b) => {
              const isSelected = activeBayId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => selectBay(b.id)}
                  className={`font-mono text-xs font-semibold px-2.5 py-1 transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#FFD100] text-[#141517] shadow-inner'
                      : 'text-[#141517] hover:bg-[#141517]/10'
                  }`}
                  title={`Inspect ${b.code}`}
                >
                  {b.id}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCarryOnDrawerOpen(true)}
            className="flex items-center gap-2 bg-[#F6F6F4]/95 hover:bg-[#FFD100] text-[#141517] border border-[#141517]/25 px-3.5 py-2 font-mono text-xs font-semibold tracking-wider transition-colors shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>CARRY-ON ({totalCarryOnCount})</span>
          </button>
        </div>
      </header>

      {/* Left Vertical Edge Anchor: Pinned vertical text button rotated -90deg reading OUR TRAUMA. */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
        <button
          onClick={() => setTraumaDrawerOpen(true)}
          style={{ writingMode: 'vertical-rl' }}
          className="rotate-180 bg-[#141517] text-[#F6F6F4] hover:bg-[#FFD100] hover:text-[#141517] border-r border-y border-[#141517] px-2.5 py-5 font-mono text-[11px] font-bold tracking-[0.26em] uppercase transition-colors duration-200 shadow-md flex items-center gap-2.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFD100] group-hover:bg-[#141517]" />
          <span>OUR TRAUMA.</span>
        </button>
      </div>

      {/* Bottom Center Micro-Prompt (fades out once a bay is clicked) */}
      <AnimatePresence>
        {!activeBayId && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1.5"
          >
            <div className="bg-[#141517]/90 backdrop-blur-md text-[#F6F6F4] border border-[#FFD100]/40 px-4 py-2 flex items-center gap-3 shadow-lg">
              <Crosshair className="w-3.5 h-3.5 text-[#FFD100] animate-spin" style={{ animationDuration: '9s' }} />
              <span className="font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase">
                SELECT A TESTING BAY TO INSPECT HARDWARE
              </span>
              <span className="hidden sm:inline-block text-[#FFD100] font-mono text-[10px]">
                [01 // 02 // 03]
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Toast Notification for ADD TO CARRY-ON */}
      <AnimatePresence>
        {justAddedToast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-20 right-6 z-50 bg-[#141517] text-[#FFD100] border border-[#FFD100] px-4 py-2.5 font-mono text-xs tracking-wider shadow-xl flex items-center gap-2.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{justAddedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          2. 2.5D PARALLAX STAGE (16:9 ASPECT-LOCKED INNER CONTAINER)
          ==================================================================== */}
      <div className="relative w-full h-full flex items-center justify-center overflow-x-auto lg:overflow-hidden">
        <motion.div
          style={{
            rotateX: activeBayId ? 0 : rotateX,
            rotateY: activeBayId ? 0 : rotateY,
            transformStyle: 'preserve-3d',
            transformOrigin: activeBay
              ? `${activeBay.left}% ${activeBay.top}%`
              : lastOriginRef.current,
          }}
          animate={{
            scale: activeBay ? activeBay.zoomScale : 1,
            filter: activeBay ? 'blur(8px)' : 'blur(0px)',
          }}
          transition={{
            duration: 0.85,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="aspect-video min-w-[1150px] sm:min-w-full min-h-full relative flex-shrink-0 flex items-center justify-center"
        >
          {/* Facility 16:9 Architectural Backdrop */}
          <img
            src="/assets/bg-facility.jpg"
            alt="The Yellow Tag 3-Bay Hardware Testing Facility"
            draggable={false}
            className="w-full h-full object-cover pointer-events-none select-none"
          />

          {/* 3 Placed Physical Product Cutouts Anchored Inside Their Exact Architectural Bays */}
          {bays.map((bay) => {
            const isHovered = hoveredBayId === bay.id && !activeBayId;
            const isActive = activeBayId === bay.id;

            return (
              <div
                key={bay.id}
                style={{
                  left: `${bay.left}%`,
                  top: `${bay.top}%`,
                  width: `${bay.width}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              >
                {/* Foreground Mouse Parallax Layer */}
                <motion.div
                  style={{
                    x: activeBayId ? 0 : fgTranslateX,
                    y: activeBayId ? 0 : fgTranslateY,
                  }}
                >
                  <button
                    type="button"
                    disabled={Boolean(activeBayId)}
                    onClick={() => selectBay(bay.id)}
                    onMouseEnter={() => !activeBayId && setHoveredBayId(bay.id)}
                    onMouseLeave={() => setHoveredBayId(null)}
                    aria-label={bay.inspectPill}
                    className="group relative w-full block focus:outline-none cursor-pointer disabled:cursor-default"
                  >
                    {/* Industrial Targeting Reticle on Hover */}
                    <AnimatePresence>
                      {(isHovered || calibratorOpen) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 1.14 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.08 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="absolute -inset-5 sm:-inset-7 pointer-events-none z-30"
                        >
                          {/* 4 Industrial Corner Brackets */}
                          <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#FFD100]" />
                          <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#FFD100]" />
                          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#FFD100]" />
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#FFD100]" />

                          {/* Subtle Crosshair Tick Marks */}
                          <div className="absolute top-1/2 -left-2 w-2 h-[1px] bg-[#FFD100]/80" />
                          <div className="absolute top-1/2 -right-2 w-2 h-[1px] bg-[#FFD100]/80" />
                          <div className="absolute -top-2 left-1/2 w-[1px] h-2 bg-[#FFD100]/80" />
                          <div className="absolute -bottom-2 left-1/2 w-[1px] h-2 bg-[#FFD100]/80" />

                          {/* Corner Telemetry Readout */}
                          <div className="absolute -top-5 left-0 font-mono text-[9px] tracking-widest bg-[#141517] text-[#FFD100] px-1.5 py-0.5 whitespace-nowrap">
                            LOCK // {bay.code}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Grounded Contact Shadow Under Pedestal / Conveyor */}
                    {bay.animationType === 'pedestal' && (
                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[78%] h-4 rounded-full pointer-events-none transition-transform duration-300"
                        style={{
                          background:
                            'radial-gradient(ellipse at center, rgba(20,21,23,0.48) 0%, rgba(20,21,23,0) 75%)',
                          transform: isHovered ? 'translateX(-50%) scale(0.92)' : 'translateX(-50%) scale(1)',
                        }}
                      />
                    )}
                    {bay.animationType === 'hover-bob' && (
                      <div
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[82%] h-5 rounded-full pointer-events-none"
                        style={{
                          background:
                            'radial-gradient(ellipse at center, rgba(20,21,23,0.42) 0%, rgba(20,21,23,0) 72%)',
                        }}
                      />
                    )}

                    {/* Continuous Physical Bay Animation (Pendulum Sway / Pedestal Poise / Hover-Bob) */}
                    <motion.div
                      animate={
                        bay.animationType === 'pendulum'
                          ? { rotate: [-1.4, 1.4, -1.4] }
                          : bay.animationType === 'hover-bob'
                          ? { y: [-4, 4, -4] }
                          : { y: [0, -1.5, 0] }
                      }
                      transition={{
                        duration: bay.animationType === 'pendulum' ? 5.8 : 4.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        transformOrigin: bay.animationType === 'pendulum' ? '50% 0%' : '50% 50%',
                      }}
                    >
                      <motion.img
                        src={bay.productImg}
                        alt={bay.title}
                        draggable={false}
                        animate={{
                          scale: isHovered ? 1.07 : 1,
                          opacity: isActive ? 0 : 1,
                        }}
                        transition={{
                          scale: { type: 'spring', stiffness: 300, damping: 20 },
                          opacity: { duration: 0.35 },
                        }}
                        style={{
                          filter: isHovered
                            ? 'drop-shadow(0 0 16px rgba(255, 209, 0, 0.72)) drop-shadow(0 18px 24px rgba(20, 21, 23, 0.42))'
                            : 'drop-shadow(0 14px 20px rgba(20, 21, 23, 0.34))',
                        }}
                        className="w-full h-auto object-contain select-none transition-[filter] duration-300"
                      />
                    </motion.div>

                    {/* Floating Pill Tag Underneath on Hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.18 }}
                          className="absolute left-1/2 -translate-x-1/2 -bottom-11 z-40 pointer-events-none whitespace-nowrap"
                        >
                          <div className="bg-[#141517] text-[#F6F6F4] border border-[#FFD100] px-3 py-1.5 shadow-xl flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD100]" />
                            <span className="font-mono text-[10px] font-bold tracking-[0.14em] uppercase">
                              {bay.inspectPill}
                            </span>
                            <ArrowUpRight className="w-3 h-3 text-[#FFD100]" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* ====================================================================
          3. STUDIO ATMOSPHERIC SCRIM & SPLIT INSPECTION VIEW (WHEN BAY CLICKED)
          ==================================================================== */}
      <AnimatePresence>
        {activeBay && (
          <motion.div
            key="inspection-room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ backgroundColor: 'rgba(229, 231, 235, 0.88)' }}
            className="fixed inset-0 z-30 backdrop-blur-[4px] flex flex-col lg:flex-row items-stretch overflow-y-auto lg:overflow-hidden pt-16 sm:pt-20 pb-4 px-4 sm:px-8 gap-5"
          >
            {/* --------------------------------------------------------------
                STEP B: LEFT 55% — PRODUCT-TO-MASCOT OPTICAL SCANNER MORPH STAGE
                -------------------------------------------------------------- */}
            <div className="w-full lg:w-[55%] min-h-[370px] sm:min-h-[450px] lg:h-full relative flex flex-col items-center justify-center p-4 sm:p-8">
              {/* Subtle architectural studio grid framing */}
              <div className="relative w-full h-full max-w-[680px] max-h-[680px] flex flex-col items-center justify-center border border-[#141517]/15 bg-[#F6F6F4]/55 backdrop-blur-sm p-6 sm:p-10 overflow-hidden shadow-sm">
                {/* Corner Calibration Marks */}
                <div className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.18em] text-[#4A4D50] flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FFD100] inline-block" />
                  <span>OPTICAL RIG // {activeBay.archiveSerial}</span>
                </div>
                <div className="absolute top-3 right-3 font-mono text-[10px] tracking-[0.18em] text-[#4A4D50]">
                  {morphDisplayMode === 'handler' ? 'STATE: HANDLER MORPH' : 'STATE: RAW HARDWARE'}
                </div>

                {/* Glowing #FFD100 Horizontal Inspection Scan-Line Sweeping Vertically */}
                <AnimatePresence>
                  {isScanning && (
                    <motion.div
                      key={`scanner-${activeBay.id}-${viewMode}`}
                      initial={{ top: '4%', opacity: 0 }}
                      animate={{ top: ['6%', '92%'], opacity: [0, 1, 1, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.65, ease: 'easeInOut' }}
                      className="absolute left-0 right-0 z-30 pointer-events-none"
                    >
                      <div
                        className="w-full h-[3px] bg-[#FFD100]"
                        style={{
                          boxShadow:
                            '0 0 22px 6px rgba(255, 209, 0, 0.85), 0 0 45px 12px rgba(255, 209, 0, 0.45)',
                        }}
                      />
                      <div className="flex justify-between px-3 pt-1 font-mono text-[9px] tracking-[0.25em] text-[#141517] font-bold">
                        <span>SCANNING HARDWARE // 100%</span>
                        <span>TRAUMA VERIFIED</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Morphed Mascot / Standalone Product Showcase Visual with Subtle Floating Parallax */}
                <motion.div
                  style={{ x: showcaseX, y: showcaseY }}
                  className="relative w-full h-full flex items-center justify-center my-4"
                >
                  {/* Grounded Studio Contact Shadow */}
                  <div
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[56%] h-7 rounded-full pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(ellipse at center, rgba(20,21,23,0.28) 0%, rgba(20,21,23,0) 74%)',
                    }}
                  />

                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${activeBay.id}-${morphDisplayMode}`}
                      src={
                        morphDisplayMode === 'handler'
                          ? activeBay.morphImg
                          : activeBay.productImg
                      }
                      alt={`${activeBay.title} - ${morphDisplayMode}`}
                      draggable={false}
                      initial={{
                        opacity: 0,
                        scale: 0.94,
                        filter: 'blur(6px)',
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        filter: 'blur(0px)',
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        filter: 'blur(6px)',
                      }}
                      transition={{
                        duration: 0.48,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        filter: 'drop-shadow(0 22px 28px rgba(20, 21, 23, 0.25))',
                      }}
                      className="max-h-[260px] sm:max-h-[380px] lg:max-h-[430px] w-auto object-contain select-none z-10"
                    />
                  </AnimatePresence>
                </motion.div>

                {/* Interactive Toggle Pill Underneath: [ OBJECT ONLY ] / [ WITH HANDLER ] */}
                <div className="relative z-20 mt-auto pt-2 flex flex-col items-center gap-1.5">
                  <div className="inline-flex items-center bg-[#141517]/10 border border-[#141517]/20 p-1">
                    <button
                      type="button"
                      onClick={() => handleToggleViewMode('object')}
                      className={`font-mono text-[11px] font-bold tracking-[0.14em] px-3.5 py-1.5 transition-all ${
                        viewMode === 'object'
                          ? 'bg-[#141517] text-[#FFD100] shadow-sm'
                          : 'text-[#141517]/75 hover:text-[#141517]'
                      }`}
                    >
                      [ OBJECT ONLY ]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleViewMode('handler')}
                      className={`font-mono text-[11px] font-bold tracking-[0.14em] px-3.5 py-1.5 transition-all ${
                        viewMode === 'handler'
                          ? 'bg-[#FFD100] text-[#141517] shadow-sm'
                          : 'text-[#141517]/75 hover:text-[#141517]'
                      }`}
                    >
                      [ WITH HANDLER ]
                    </button>
                  </div>
                  <span className="font-mono text-[9px] tracking-[0.2em] text-[#4A4D50] uppercase">
                    OPTICAL SCANNER MORPH // CLICK TO TOGGLE HANDLER
                  </span>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------
                STEP C: RIGHT 45% — BRUTALIST-LUXURY EDITORIAL & FAKE BUY NOW PANEL
                -------------------------------------------------------------- */}
            <motion.aside
              key={`panel-${activeBay.id}`}
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 48 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="w-full lg:w-[45%] lg:h-full flex flex-col justify-between bg-[#F6F6F4] border border-[#141517]/15 shadow-2xl overflow-y-auto custom-scrollbar"
            >
              {/* Top Bar with <- RETURN TO FACILITY (ESC) & Next/Prev Bay Switcher (01 / 02 / 03) */}
              <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[#141517]/15 bg-[#F6F6F4] sticky top-0 z-20">
                <button
                  type="button"
                  onClick={() => {
                    setActiveBayId(null);
                    mouseX.set(0);
                    mouseY.set(0);
                  }}
                  className="group flex items-center gap-2 font-mono text-xs font-bold tracking-[0.12em] text-[#141517] hover:text-[#141517] bg-[#E5E7EB]/70 hover:bg-[#FFD100] px-3 py-1.5 border border-[#141517]/15 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>RETURN TO FACILITY</span>
                  <span className="hidden sm:inline-block text-[10px] text-[#4A4D50] group-hover:text-[#141517] ml-1">
                    [ESC]
                  </span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCycleBay(-1)}
                    className="p-1.5 border border-[#141517]/15 hover:bg-[#FFD100] transition-colors"
                    title="Previous Bay"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center font-mono text-xs border border-[#141517]/15 bg-[#E5E7EB]/50 px-2 py-1 gap-1">
                    {bays.map((b, i) => (
                      <React.Fragment key={b.id}>
                        <button
                          type="button"
                          onClick={() => selectBay(b.id)}
                          className={`px-1 font-bold transition-colors ${
                            b.id === activeBay.id
                              ? 'bg-[#FFD100] text-[#141517]'
                              : 'text-[#4A4D50] hover:text-[#141517]'
                          }`}
                        >
                          {b.id}
                        </button>
                        {i < 2 && <span className="text-[#4A4D50]/50">/</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCycleBay(1)}
                    className="p-1.5 border border-[#141517]/15 hover:bg-[#FFD100] transition-colors"
                    title="Next Bay"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Editorial Logbook Body */}
              <div className="px-6 sm:px-7 py-5 sm:py-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  {/* Eyebrow */}
                  <div className="inline-flex items-center gap-2 bg-[#141517] text-[#FFD100] px-2.5 py-1 font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] uppercase mb-3">
                    <span>{activeBay.eyebrow}</span>
                  </div>

                  {/* Title */}
                  <h1 className="font-sans font-black text-2xl sm:text-3xl xl:text-[38px] tracking-[-0.03em] text-[#141517] leading-[1.06]">
                    {activeBay.title}
                  </h1>

                  {/* Price & Ironic Fee Subtext */}
                  <div className="mt-3 pb-3.5 perforated-divider flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono font-bold text-2xl sm:text-[28px] text-[#141517]">
                        {activeBay.price}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest bg-[#FFD100]/40 text-[#141517] px-2 py-0.5 border border-[#141517]/15">
                        FLAT TARIFF
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-[#4A4D50] italic">
                      {activeBay.priceSubtext}
                    </p>
                  </div>

                  {/* Editorial Copy */}
                  <p className="mt-3.5 font-sans text-xs sm:text-sm leading-relaxed text-[#141517]/90 font-normal">
                    {activeBay.copy}
                  </p>
                </div>

                {/* 2x2 Spec Grid (Mono Pills) */}
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-[#4A4D50] uppercase mb-2">
                    <span>TECHNICAL LOGBOOK SPECIFICATIONS</span>
                    <span>REF // {activeBay.archiveSerial}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-4 perforated-divider">
                    {activeBay.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="bg-[#E5E7EB]/55 border border-[#141517]/15 px-3 py-2 flex flex-col justify-between"
                      >
                        <span className="font-mono text-[9px] tracking-[0.18em] text-[#4A4D50] uppercase">
                          {spec.label}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-[#141517] tracking-wider mt-0.5">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Boarding Pass Barcode & CTAs */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                    {/* Primary CTA Button: BUY NOW — $45.00 */}
                    <button
                      type="button"
                      onClick={() => handleOpenBuyNow(activeBay)}
                      className="flex-1 bg-[#FFD100] hover:bg-[#141517] text-[#141517] hover:text-[#FFD100] border border-[#141517] py-3.5 px-5 font-mono text-xs sm:text-sm font-bold tracking-[0.16em] uppercase transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>BUY NOW — $45.00</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>

                    {/* Secondary Micro-Button: ADD TO CARRY-ON */}
                    <button
                      type="button"
                      onClick={() => handleAddToCarryOn(activeBay)}
                      className="bg-[#F6F6F4] hover:bg-[#141517] text-[#141517] hover:text-[#F6F6F4] border border-[#141517] py-3.5 px-4 font-mono text-xs font-bold tracking-[0.15em] uppercase transition-colors duration-200 whitespace-nowrap"
                    >
                      + ADD TO CARRY-ON
                    </button>
                  </div>

                  {/* Boarding-Pass Metadata Footer */}
                  <div className="flex items-center justify-between pt-1 font-mono text-[10px] tracking-[0.16em] text-[#4A4D50]">
                    <span>CLEARANCE: {activeBay.tariffCode}</span>
                    <span>BATCH // MAY 2026</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          4. FAKE BUY NOW / BOARDING PASS RECEIPT MODAL
          ==================================================================== */}
      <AnimatePresence>
        {checkoutBay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setCheckoutBay(null);
              setOrderStamped(false);
            }}
            className="fixed inset-0 z-50 bg-[#141517]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#F6F6F4] text-[#141517] border-2 border-[#141517] shadow-2xl overflow-hidden"
            >
              {/* Top Thermal Receipt Header */}
              <div className="bg-[#141517] text-[#F6F6F4] px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFD100]" />
                  <span className="font-mono text-xs font-bold tracking-[0.18em] uppercase">
                    BOARDING PASS RECEIPT // GATE CHECKOUT
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutBay(null);
                    setOrderStamped(false);
                  }}
                  className="text-[#F6F6F4]/70 hover:text-[#FFD100] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Exhausted Mascot Solo Header */}
              <div className="relative bg-[#E5E7EB]/65 border-b border-[#141517]/15 px-6 pt-5 pb-4 flex items-center gap-5">
                <div className="w-20 h-24 flex-shrink-0 bg-[#F6F6F4] border border-[#141517]/15 p-1.5 flex items-center justify-center shadow-inner">
                  <img
                    src="/assets/mascot-solo.png"
                    alt="Exhausted Baggage Handler Mascot"
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <div className="inline-block bg-[#FFD100] text-[#141517] font-mono text-[9px] font-bold tracking-[0.2em] px-2 py-0.5 uppercase">
                    KIOSK TERMINAL #04 // ZONE 4
                  </div>
                  <h3 className="font-sans font-black text-lg tracking-tight text-[#141517]">
                    FINAL GATE MANIFEST
                  </h3>
                  <p className="font-mono text-[11px] text-[#4A4D50] leading-snug">
                    Handler status: Deeply exhausted. Zero hidden surcharges detected.
                  </p>
                </div>
              </div>

              {/* Thermal-Receipt Style Itemized Breakdown */}
              <div className="p-6 space-y-4 relative">
                <div className="space-y-2.5 font-mono text-xs pb-4 perforated-divider">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-[#141517] block">
                        Selected Hardware Item
                      </span>
                      <span className="text-[11px] text-[#4A4D50]">
                        {checkoutBay.title} ({checkoutBay.code})
                      </span>
                    </div>
                    <span className="font-bold text-[#141517]">$45.00</span>
                  </div>

                  <div className="flex justify-between items-center text-[#4A4D50]">
                    <span>Seat Selection Fee (Middle Seat 28E)</span>
                    <span className="bg-[#141517]/10 text-[#141517] px-1.5 py-0.5 text-[10px] font-bold">
                      $0.00 (WAIVED)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[#4A4D50]">
                    <span>Emotional Baggage Surcharge</span>
                    <span className="bg-[#141517]/10 text-[#141517] px-1.5 py-0.5 text-[10px] font-bold">
                      $0.00 (INCLUDED)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[#4A4D50]">
                    <span>Print Boarding Pass at Kiosk Fee</span>
                    <span className="font-bold text-[#141517]">$0.00</span>
                  </div>
                </div>

                {/* TOTAL DUE */}
                <div className="flex justify-between items-baseline pb-4 perforated-divider">
                  <span className="font-mono text-sm font-bold tracking-[0.14em] uppercase">
                    TOTAL DUE:
                  </span>
                  <span className="font-mono text-2xl font-black text-[#141517]">
                    $45.00
                  </span>
                </div>

                {/* Snappy Stamp Animation Overlay when CONFIRM FAKE ORDER is clicked */}
                <AnimatePresence mode="wait">
                  {!orderStamped ? (
                    <motion.button
                      key="confirm-btn"
                      type="button"
                      onClick={() => setOrderStamped(true)}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-[#FFD100] hover:bg-[#141517] text-[#141517] hover:text-[#FFD100] border-2 border-[#141517] py-3.5 px-5 font-mono text-xs sm:text-sm font-bold tracking-[0.18em] uppercase transition-colors shadow-md"
                    >
                      CONFIRM FAKE ORDER — $45.00
                    </motion.button>
                  ) : (
                    <motion.div
                      key="stamped-box"
                      initial={{ opacity: 0, scale: 1.45, rotate: -8 }}
                      animate={{ opacity: 1, scale: 1, rotate: -2 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      className="border-2 border-[#141517] bg-[#FFD100] p-4 text-center space-y-2 shadow-lg"
                    >
                      <div className="inline-block border-2 border-[#141517] px-3 py-1 font-mono text-xs sm:text-sm font-black tracking-[0.18em] uppercase text-[#141517]">
                        GATE CHECKED — PREVIEW MODE ONLY
                      </div>
                      <p className="font-sans text-xs font-semibold text-[#141517] leading-relaxed">
                        “This is a concept storefront preview. Your wallet survived—unlike the airline.”
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fake Boarding Pass Barcode Strip */}
                <div className="pt-2 flex flex-col items-center gap-1 opacity-75">
                  <div
                    className="w-full h-7"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, #141517 0px, #141517 2px, transparent 2px, transparent 5px, #141517 5px, #141517 6px, transparent 6px, transparent 9px, #141517 9px, #141517 13px, transparent 13px, transparent 15px)',
                    }}
                  />
                  <span className="font-mono text-[9px] tracking-[0.32em] text-[#4A4D50]">
                    *TYT-GROUNDED-052026-GATE28E*
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          5. "OUR TRAUMA." EDITORIAL MANIFESTO DRAWER (LEFT EDGE ANCHOR)
          ==================================================================== */}
      <AnimatePresence>
        {traumaDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTraumaDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-[#141517]/70 backdrop-blur-sm flex justify-start"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md h-full bg-[#F6F6F4] text-[#141517] border-r-2 border-[#141517] p-6 sm:p-9 flex flex-col justify-between overflow-y-auto shadow-2xl"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between pb-4 perforated-divider">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#FFD100] border border-[#141517]" />
                  <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase">
                    ARCHIVE MANIFESTO // OUR TRAUMA.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTraumaDrawerOpen(false)}
                  className="p-1.5 border border-[#141517]/20 hover:bg-[#FFD100] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Solo Mascot Portrait & 3-Line Brand Manifesto */}
              <div className="my-auto py-3 space-y-4">
                <div className="relative bg-[#E5E7EB] border border-[#141517]/15 p-4 flex flex-col items-center justify-center">
                  <span className="absolute top-2 left-3 font-mono text-[9px] tracking-[0.2em] text-[#4A4D50]">
                    FIG 00 // HANDLER IN RESIDENCE
                  </span>
                  <img
                    src="/assets/mascot-solo.png"
                    alt="Weary Banana Baggage Handler Mascot"
                    className="h-40 sm:h-44 w-auto object-contain drop-shadow-xl"
                  />
                  <span className="mt-2 font-mono text-[10px] tracking-[0.18em] bg-[#141517] text-[#FFD100] px-2.5 py-0.5">
                    SHIFT ENDED: MAY 2026
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="font-mono text-[10px] tracking-[0.2em] text-[#4A4D50] uppercase">
                    POST-GROUNDING ARCHIVE STATEMENT
                  </div>
                  <h2 className="font-sans font-black text-xl sm:text-2xl tracking-tight leading-tight">
                    Born from the cultural trauma of budget air travel.
                  </h2>
                  {/* Tight 3-line brand manifesto */}
                  <div className="space-y-2 font-sans text-xs sm:text-[13px] text-[#141517]/90 leading-relaxed border-l-2 border-[#FFD100] pl-3.5">
                    <p>
                      <strong>01.</strong> For a decade, that blinding safety-yellow boarding pass meant knees in your chin, plastic sizing cages at the gate, and $79 surcharges for a tote bag.
                    </p>
                    <p>
                      <strong>02.</strong> When the yellow fleet finally grounded in May 2026, we melted the collective trauma down into unyielding brass, glazed ceramic, and corrugated cargo-grade aluminium.
                    </p>
                    <p>
                      <strong>03.</strong> Zero logos. Zero hidden gate fees. Just over-engineered travel hardware built to outlast the terminal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom CTA to Inspect Bays */}
              <div className="pt-4 perforated-divider flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#4A4D50]">
                  EDITION 01 // 3 OBJECTS
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTraumaDrawerOpen(false);
                    selectBay('01');
                  }}
                  className="bg-[#141517] hover:bg-[#FFD100] text-[#FFD100] hover:text-[#141517] px-4 py-2 font-mono text-xs font-bold tracking-[0.16em] uppercase transition-colors"
                >
                  INSPECT BAY 01 →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          6. CARRY-ON BAG DRAWER
          ==================================================================== */}
      <AnimatePresence>
        {carryOnDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCarryOnDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-[#141517]/65 backdrop-blur-sm flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm h-full bg-[#F6F6F4] text-[#141517] border-l-2 border-[#141517] p-6 flex flex-col justify-between shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 perforated-divider">
                <span className="font-mono text-xs font-bold tracking-[0.18em] uppercase">
                  PERSONAL CARRY-ON ({totalCarryOnCount})
                </span>
                <button
                  type="button"
                  onClick={() => setCarryOnDrawerOpen(false)}
                  className="p-1.5 border border-[#141517]/20 hover:bg-[#FFD100]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-auto py-6 space-y-3 overflow-y-auto">
                {carryOnItems.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <p className="font-mono text-xs text-[#4A4D50] uppercase tracking-widest">
                      SIZING CAGE EMPTY
                    </p>
                    <p className="font-sans text-xs text-[#4A4D50]">
                      Fits easily under the seat in front of you because there is nothing in it yet.
                    </p>
                  </div>
                ) : (
                  carryOnItems.map((item) => {
                    const bayMatch = bays.find((b) => b.id === item.id)!;
                    return (
                      <div
                        key={item.id}
                        className="bg-[#E5E7EB]/60 border border-[#141517]/15 p-3.5 flex items-center justify-between gap-3"
                      >
                        <img
                          src={bayMatch.productImg}
                          alt={item.title}
                          className="w-10 h-12 object-contain"
                        />
                        <div className="flex-1">
                          <div className="font-mono text-[10px] text-[#4A4D50]">
                            {item.code}
                          </div>
                          <div className="font-sans font-bold text-sm">
                            {item.title}
                          </div>
                          <div className="font-mono text-xs text-[#141517]">
                            QTY: {item.qty} × $45.00
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCarryOnItems((prev) =>
                              prev.filter((i) => i.id !== item.id)
                            )
                          }
                          className="font-mono text-[10px] text-[#4A4D50] hover:text-[#141517] underline"
                        >
                          REMOVE
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 perforated-divider space-y-3">
                <div className="flex justify-between font-mono text-xs font-bold">
                  <span>CARRY-ON SUBTOTAL</span>
                  <span>${(totalCarryOnCount * 45).toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCarryOnDrawerOpen(false);
                    handleOpenBuyNow(activeBay || bays[0]);
                  }}
                  className="w-full bg-[#FFD100] hover:bg-[#141517] text-[#141517] hover:text-[#FFD100] border border-[#141517] py-3.5 font-mono text-xs font-bold tracking-[0.18em] uppercase transition-colors"
                >
                  PROCEED TO GATE RECEIPT →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          7. DEV POSITION CALIBRATOR HUD (TOGGLED VIA SHIFT + D)
          ==================================================================== */}
      <AnimatePresence>
        {calibratorOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-4 right-4 z-50 w-80 bg-[#141517] text-[#F6F6F4] border border-[#FFD100] p-4 shadow-2xl font-mono text-xs space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#F6F6F4]/20 pb-2">
              <div className="flex items-center gap-2 text-[#FFD100]">
                <Sliders className="w-3.5 h-3.5" />
                <span className="font-bold tracking-wider">CALIBRATE POSITIONS</span>
              </div>
              <button
                type="button"
                onClick={() => setCalibratorOpen(false)}
                className="text-[#F6F6F4]/60 hover:text-[#FFD100]"
              >
                [SHIFT+D]
              </button>
            </div>

            {bays.map((b) => (
              <div key={b.id} className="space-y-1 border-b border-[#F6F6F4]/10 pb-2">
                <div className="text-[#FFD100] font-bold text-[10px]">{b.code}</div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <label className="flex flex-col">
                    <span className="text-[#F6F6F4]/60">LEFT %</span>
                    <input
                      type="number"
                      step="0.5"
                      value={b.left}
                      onChange={(e) =>
                        updateBayCoordinate(b.id, 'left', parseFloat(e.target.value) || 0)
                      }
                      className="bg-[#F6F6F4]/10 border border-[#F6F6F4]/20 px-1.5 py-0.5 text-[#F6F6F4]"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-[#F6F6F4]/60">TOP %</span>
                    <input
                      type="number"
                      step="0.5"
                      value={b.top}
                      onChange={(e) =>
                        updateBayCoordinate(b.id, 'top', parseFloat(e.target.value) || 0)
                      }
                      className="bg-[#F6F6F4]/10 border border-[#F6F6F4]/20 px-1.5 py-0.5 text-[#F6F6F4]"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-[#F6F6F4]/60">WIDTH %</span>
                    <input
                      type="number"
                      step="0.5"
                      value={b.width}
                      onChange={(e) =>
                        updateBayCoordinate(b.id, 'width', parseFloat(e.target.value) || 0)
                      }
                      className="bg-[#F6F6F4]/10 border border-[#F6F6F4]/20 px-1.5 py-0.5 text-[#F6F6F4]"
                    />
                  </label>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
