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
    slideNumIndicator.innerText = `${activeSlideIndex + 1} / ${allSlides.length}`;

    // Disparar animações baseadas no slide atual
    // Slide 7: Simulador NVMe vs SATA
    if (activeSlideIndex === 6) {
        initializeThroughputSimulator();
    } else {
        clearThroughputSimulator();
    }

    // Slide 12: Gráfico de Barras
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

    let totalLanes = activeProtocol === 'sata' ? 1 : 10;

    // Atualiza Texto
    if (activeProtocol === 'sata') {
        mQueues.innerText = "1 Fila Única (AHCI)";
        mIops.innerText = "~80.000 IOPS";
        mIops.style.color = "#ef4444";
    } else {
        mQueues.innerText = "64.000 Filas Paralelas (PCIe)";
        mIops.innerText = "1.500.000+ IOPS";
        mIops.style.color = "var(--accent)";
    }

    const laneHeight = canvasContainer.clientHeight / totalLanes;
    const elementsLanesRefs = [];
    
    for(let i = 0; i < totalLanes; i++) {
        const divLane = document.createElement('div');
        divLane.className = 'sim-lane';
        divLane.style.height = `${laneHeight}px`;
        canvasContainer.appendChild(divLane);
        elementsLanesRefs.push(divLane);
    }

    let spawnProbability = activeProtocol === 'sata' ? 0.5 : 0.3;
    let packetSpeed = activeProtocol === 'sata' ? 3 : 12;

    simulationInterval = setInterval(() => {
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

                    if (currentX < canvasContainer.clientWidth - 20) {
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
    }, 100);
}


// --- 3. LÓGICA DO CHART (COMPARAÇÃO DE ARQUITETURas) ---
let activeMetric = 'bw';

const rawMetricData = {
    bw: {
        nand: { width: '5%', label: '0.01 TB/s' },
        nvme: { width: '15%', label: '0.014 TB/s' },
        ddr5: { width: '40%', label: '0.08 TB/s' },
        hbm:  { width: '100%', label: '1.20+ TB/s' }
    },
    lat: {
        nand: { width: '10%', label: '50.000 ns (Lento)' },
        nvme: { width: '20%', label: '10.000 ns' },
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

    // Reseta visualmente a animação
    fillNand.style.width = '0%';
    fillNvme.style.width = '0%';
    fillDdr5.style.width = '0%';
    fillHbm.style.width = '0%';

    setTimeout(() => {
        fillNand.style.width = currentDataset.nand.width;
        fillNand.innerText = currentDataset.nand.label;

        fillNvme.style.width = currentDataset.nvme.width;
        fillNvme.innerText = currentDataset.nvme.label;

        fillDdr5.style.width = currentDataset.ddr5.width;
        fillDdr5.innerText = currentDataset.ddr5.label;

        fillHbm.style.width = currentDataset.hbm.width;
        fillHbm.innerText = currentDataset.hbm.label;
    }, 50);
}
