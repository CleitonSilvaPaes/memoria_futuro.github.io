// --- 1. NAVEGAÇÃO DE SLIDES ---
let activeSlideIndex = 0;
const allSlides = document.querySelectorAll('.slide');
const slideNumIndicator = document.getElementById('slide-num');

function navigateSlide(direction) {
    // Remove a classe do slide atual
    allSlides[activeSlideIndex].classList.remove('active');
    
    // Atualiza o índice
    activeSlideIndex += direction;
    if (activeSlideIndex >= allSlides.length) activeSlideIndex = 0;
    if (activeSlideIndex < 0) activeSlideIndex = allSlides.length - 1;
    
    // Adiciona a classe ao novo slide
    allSlides[activeSlideIndex].classList.add('active');
    if (slideNumIndicator) {
        slideNumIndicator.innerText = `${activeSlideIndex + 1} / ${allSlides.length}`;
    }

    // =======================================================
    // DISPARADORES DE ANIMAÇÃO (CORRIGIDOS PARA 15 SLIDES)
    // =======================================================
    
    // Slide 7 (Índice 6): Simulador NVMe vs SATA
    if (activeSlideIndex === 6) {
        initializeThroughputSimulator();
    } else {
        clearThroughputSimulator();
    }

    // Slide 8 (Índice 7): Simulador 3D do HBM Elevador TSV
    if (activeSlideIndex === 7) {
        startHbmElevatorAnimation();
    } else {
        stopHbmElevatorAnimation();
    }

    // Slide 12 (Índice 11): Gráfico de Barras de Arquitetura
    if (activeSlideIndex === 11) {
        triggerChartAnimation();
    }
}

// Navegação por teclado
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') navigateSlide(1);
    if (event.key === 'ArrowLeft') navigateSlide(-1);
});


// --- 2. LÓGICA DO SIMULADOR DE DATABASE THROUGHPUT (SATA vs NVMe) ---
let activeProtocol = 'sata';
let simulationInterval = null;
let animationFrames = [];
const canvasContainer = document.getElementById('throughput-canvas');

function toggleSimMode(selectedMode) {
    activeProtocol = selectedMode;
    document.getElementById('btn-sata').classList.toggle('active', selectedMode === 'sata');
    document.getElementById('btn-nvme').classList.toggle('active', selectedMode === 'nvme');
    initializeThroughputSimulator();
}

function clearThroughputSimulator() {
    if (simulationInterval) clearInterval(simulationInterval);
    animationFrames.forEach(frame => cancelAnimationFrame(frame));
    animationFrames = [];
    if(canvasContainer) canvasContainer.innerHTML = '';
}

function initializeThroughputSimulator() {
    clearThroughputSimulator();

    const mQueues = document.getElementById('m-queues');
    const mIops = document.getElementById('m-iops');

    let totalLanes = activeProtocol === 'sata' ? 1 : 12;

    // Atualiza Texto
    if (activeProtocol === 'sata') {
        if(mQueues) mQueues.innerText = "1 Fila Única (AHCI)";
        if(mIops) { mIops.innerText = "~80.000 IOPS"; mIops.style.color = "#ef4444"; }
    } else {
        if(mQueues) mQueues.innerText = "64.000 Filas Paralelas";
        if(mIops) { mIops.innerText = "1.500.000+ IOPS"; mIops.style.color = "var(--accent)"; }
    }

    if(!canvasContainer) return;

    const laneHeight = canvasContainer.clientHeight / totalLanes;
    const elementsLanesRefs = [];
    
    for(let i = 0; i < totalLanes; i++) {
        const divLane = document.createElement('div');
        divLane.className = 'sim-lane';
        divLane.style.height = `${laneHeight}px`;
        canvasContainer.appendChild(divLane);
        elementsLanesRefs.push(divLane);
    }

    let spawnProbability = activeProtocol === 'sata' ? 0.4 : 0.25;
    let packetSpeed = activeProtocol === 'sata' ? 3 : 14;

    simulationInterval = setInterval(() => {
        // Pausa se não estiver no Slide 7 (Índice 6)
        if (activeSlideIndex !== 6) return; 

        elementsLanesRefs.forEach(laneElement => {
            if (Math.random() < spawnProbability) {
                const packetElement = document.createElement('div');
                packetElement.className = `data-packet ${activeProtocol === 'sata' ? 'sata-packet' : ''}`;
                packetElement.style.left = '0px';
                laneElement.appendChild(packetElement);

                let currentX = 0;
                function step() {
                    currentX += packetSpeed;
                    packetElement.style.left = `${currentX}px`;

                    if (currentX < canvasContainer.clientWidth - 30) {
                        let frameId = requestAnimationFrame(step);
                        animationFrames.push(frameId);
                    } else {
                        if (laneElement.contains(packetElement)) {
                            laneElement.removeChild(packetElement);
                        }
                    }
                }
                step();
            }
        });
    }, 120);
}


// --- 3. LÓGICA DO CHART (COMPARAÇÃO DE ARQUITETURAS) ---
let activeMetric = 'bw';

const rawMetricData = {
    bw: {
        nand: { width: '7%', label: '0.0015 TB/s' },
        nvme: { width: '14%', label: '0.0145 TB/s' },
        ddr5: { width: '40%', label: '0.08 TB/s' },
        hbm:  { width: '100%', label: '1.20+ TB/s' }
    },
    lat: {
        nand: { width: '10%', label: '50.000 ns (Lento)' },
        nvme: { width: '20%', label: '12.000 ns' },
        ddr5: { width: '90%', label: '80 ns' },
        hbm:  { width: '100%', label: '100 ns (Rápido)' }
    }
};

function toggleMetricMode(selectedMetric) {
    activeMetric = selectedMetric;
    document.getElementById('btn-metric-bw').classList.toggle('active', selectedMetric === 'bw');
    document.getElementById('btn-metric-lat').classList.toggle('active', selectedMetric === 'lat');
    triggerChartAnimation();
}

function triggerChartAnimation() {
    const currentDataset = rawMetricData[activeMetric];
    
    const fillNand = document.getElementById('bar-nand');
    const fillNvme = document.getElementById('bar-nvme');
    const fillDdr5 = document.getElementById('bar-ddr5');
    const fillHbm = document.getElementById('bar-hbm');

    if(!fillNand) return;

    // Reseta visualmente a animação
    fillNand.style.width = '0%';
    fillNvme.style.width = '0%';
    if(fillDdr5) fillDdr5.style.width = '0%';
    fillHbm.style.width = '0%';

    setTimeout(() => {
        fillNand.style.width = currentDataset.nand.width;
        fillNand.innerText = currentDataset.nand.label;

        fillNvme.style.width = currentDataset.nvme.width;
        fillNvme.innerText = currentDataset.nvme.label;

        if(fillDdr5) {
            fillDdr5.style.width = currentDataset.ddr5.width;
            fillDdr5.innerText = currentDataset.ddr5.label;
        }

        fillHbm.style.width = currentDataset.hbm.width;
        fillHbm.innerText = currentDataset.hbm.label;
    }, 50);
}


// --- 4. LÓGICA DO SIMULADOR 3D (HBM TSV ELEVATOR) ---
let hbmInterval = null;

function startHbmElevatorAnimation() {
    const scene = document.getElementById('hbm-scene');
    if(!scene) return;
    
    stopHbmElevatorAnimation(); // Garante que não há loops duplicados

    // Coordenadas X e Y que alinham com a torre HBM na nossa cena CSS
    const tsvShafts = [
        {x: 170, y: 40},
        {x: 230, y: 40},
        {x: 170, y: 90},
        {x: 230, y: 90}
    ];

    hbmInterval = setInterval(() => {
        // Pausa se não estiver no Slide 8 (Índice 7)
        if (activeSlideIndex !== 7) return; 

        const packet = document.createElement('div');
        packet.className = 'data-packet-3d';
        
        // Escolhe um "poço de elevador" aleatório da torre HBM
        const shaft = tsvShafts[Math.floor(Math.random() * tsvShafts.length)];

        // Usa a API Web Animations para criar a viagem 3D
        const animation = packet.animate([
            // ETAPA 1: Nasce no topo da pilha DRAM (Z = 120px)
            { transform: `translateX(${shaft.x}px) translateY(${shaft.y}px) translateZ(120px)`, opacity: 0, offset: 0 },
            { transform: `translateX(${shaft.x}px) translateY(${shaft.y}px) translateZ(115px)`, opacity: 1, offset: 0.1 },
            
            // ETAPA 2: Desce pelo elevador TSV até à base Logic Die (Z = 15px)
            { transform: `translateX(${shaft.x}px) translateY(${shaft.y}px) translateZ(15px)`, offset: 0.4 },
            
            // ETAPA 3: Viaja horizontalmente pelo Interposer até à borda da GPU
            { transform: `translateX(120px) translateY(70px) translateZ(15px)`, offset: 0.6 },
            
            // ETAPA 4: Entra na GPU Core
            { transform: `translateX(60px) translateY(70px) translateZ(15px)`, opacity: 1, offset: 0.9 },
            { transform: `translateX(40px) translateY(70px) translateZ(15px)`, opacity: 0, offset: 1 }
        ], {
            duration: 1800 + Math.random() * 1000, 
            easing: 'linear',
            fill: 'forwards'
        });

        scene.appendChild(packet);

        animation.onfinish = () => {
            if(scene.contains(packet)) scene.removeChild(packet);
        };

    }, 250); 
}

function stopHbmElevatorAnimation() {
    if(hbmInterval) clearInterval(hbmInterval);
    const scene = document.getElementById('hbm-scene');
    if(scene) {
        const packets = scene.querySelectorAll('.data-packet-3d');
        packets.forEach(p => scene.removeChild(p));
    }
}