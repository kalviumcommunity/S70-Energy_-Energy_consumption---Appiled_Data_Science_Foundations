document.addEventListener('DOMContentLoaded', async () => {
    // 0. Tab Navigation Logic
    const tabItems = document.querySelectorAll('.sidebar-nav li[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    tabItems.forEach(item => {
        item.addEventListener('click', () => {
            tabItems.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            item.classList.add('active');

            const tabId = `view-${item.getAttribute('data-tab')}`;
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });

    // 1. Fetching Real CSV Data separately
    let residents = [];
    let totalUsageWeek2 = 0;
    let recentRowsHtml = '';

    const fetchCsv = (url) => new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (res) => resolve(res.data),
            error: (err) => reject(err)
        });
    });

    try {
        const [energyData, aptUsageData, catUsageData] = await Promise.all([
            fetchCsv('apartment_energy_data.csv'),
            fetchCsv('apartment_usage.csv'),
            fetchCsv('category_usage.csv')
        ]);

        const avgs = { A: 0, B: 0, C: 0 };
        catUsageData.forEach(row => {
            if (row.var2 && avgs[row.var2] !== undefined) {
                avgs[row.var2] = row.electricity_consumption;
            }
        });
        window.catAverages = avgs;

        const aptMap = {};
        energyData.forEach(row => {
            const id = row.apartment_id;
            if (!id) return;
            if (!aptMap[id]) {
                aptMap[id] = { id, type: row.apartment_type, usage: 0, dailyMap: {} };
            }
            const dateStr = String(row.datetime).replace(' ', 'T');
            const dateObj = new Date(dateStr);
            let dayIdx = dateObj.getDay() - 1; 
            if (dayIdx === -1) dayIdx = 6;
            
            if (!aptMap[id].dailyMap[dayIdx]) aptMap[id].dailyMap[dayIdx] = 0;
            aptMap[id].dailyMap[dayIdx] += row.electricity_consumption || 0;
        });

        aptUsageData.forEach(row => {
            const id = row.apartment_id;
            if (id && aptMap[id]) {
                aptMap[id].usage = row.electricity_consumption || 0;
            }
        });

        for (const id in aptMap) {
            const apt = aptMap[id];
            totalUsageWeek2 += apt.usage;
            const daily = [];
            for(let i=0; i<7; i++) daily.push(Math.round(apt.dailyMap[i] || 0));
            apt.usage = Math.round(apt.usage);
            apt.daily = daily;
            apt.isHighUsage = apt.usage > avgs[apt.type] * 1.2;
            residents.push(apt);
        }

        residents.sort((a,b) => b.usage - a.usage);

        const lastRows = energyData.slice(-15).reverse();
        recentRowsHtml = lastRows.map(row => {
            let usage = row.electricity_consumption || 0;
            let isPeak = usage > 100;
            let status = isPeak ? 'High' : 'Normal';
            let statusClass = isPeak ? 'status-high' : 'status-normal';
            return `
                <tr>
                    <td>${row.datetime}</td>
                    <td><strong>${row.apartment_id}</strong></td>
                    <td>Type ${row.apartment_type}</td>
                    <td>${usage.toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                </tr>
            `;
        }).join('');

        const loader = document.getElementById('loading-overlay');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }

    } catch (err) {
        console.error("Failed to load data", err);
    }

    // Update Transparency Table
    const tableBody = document.querySelector('#transparencyTable tbody');
    if (tableBody) tableBody.innerHTML = recentRowsHtml;

    // Update KPI
    document.getElementById('kpi-total-energy').innerText = `${Math.round(totalUsageWeek2).toLocaleString()} kWh`;

    // Render Resident Grid (Resident Usage Table representation)
    const renderResidentGrid = (filterType) => {
        const grid = document.getElementById('residentGrid');
        grid.innerHTML = '';

        residents.forEach(r => {
            if (filterType !== 'All' && r.type !== filterType) return;

            let item = document.createElement('div');
            item.className = 'resident-item';
            if (r.isHighUsage) {
                item.classList.add('high-usage-alert');
                // Give a tooltip to explain the high usage highlight
                item.title = 'High Usage Alert: Over 20% above average for type ' + r.type;
            }
            item.innerHTML = `
                <span class="apt-id">${r.id}</span>
                <span class="apt-type">Type ${r.type}</span>
                <span class="apt-usage">${r.usage} kWh</span>
            `;
            item.addEventListener('click', () => {
                if (window.openReportModal) {
                    window.openReportModal(r);
                }
            });
            grid.appendChild(item);
        });
    };

    renderResidentGrid('All');

    document.getElementById('typeFilter').addEventListener('change', (e) => {
        renderResidentGrid(e.target.value);
    });

    // 2. Chart.js Setup
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    // Seasonal Trends Chart
    const ctxSeasonal = document.getElementById('seasonalChart').getContext('2d');
    const gradientSeasonal = ctxSeasonal.createLinearGradient(0, 0, 0, 400);
    gradientSeasonal.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradientSeasonal.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    new Chart(ctxSeasonal, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Avg Building Energy (MWh)',
                data: [65, 59, 45, 41, 48, 62, 75, 78, 60, 45, 52, 68],
                borderColor: '#3b82f6',
                backgroundColor: gradientSeasonal,
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    beginAtZero: true
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Benchmark Chart
    const cTypeA = residents.filter(r => r.type === 'A');
    const cTypeB = residents.filter(r => r.type === 'B');
    const cTypeC = residents.filter(r => r.type === 'C');

    // Use category usage data from the CSV file
    const avgA = window.catAverages ? window.catAverages.A : (cTypeA.length ? cTypeA.reduce((s, r) => s + r.usage, 0) / cTypeA.length : 450);
    const avgB = window.catAverages ? window.catAverages.B : (cTypeB.length ? cTypeB.reduce((s, r) => s + r.usage, 0) / cTypeB.length : 300);
    const avgC = window.catAverages ? window.catAverages.C : (cTypeC.length ? cTypeC.reduce((s, r) => s + r.usage, 0) / cTypeC.length : 180);

    const ctxBenchmark = document.getElementById('benchmarkChart').getContext('2d');
    new Chart(ctxBenchmark, {
        type: 'bar',
        data: {
            labels: ['Type A (Large)', 'Type B (Medium)', 'Type C (Efficient)'],
            datasets: [{
                label: 'Average Weekly Usage (kWh)',
                data: [Math.floor(avgA), Math.floor(avgB), Math.floor(avgC)],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',   // Red
                    'rgba(245, 158, 11, 0.8)',  // Orange
                    'rgba(16, 185, 129, 0.8)'   // Green
                ],
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)'
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    beginAtZero: true
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Distribution Chart (Box Plot)
    const usageA = cTypeA.map(r => r.usage);
    const usageB = cTypeB.map(r => r.usage);
    const usageC = cTypeC.map(r => r.usage);

    const ctxDist = document.getElementById('distributionChart').getContext('2d');
    new Chart(ctxDist, {
        type: 'boxplot',
        data: {
            labels: ['A', 'B', 'C'],
            datasets: [{
                label: 'Electricity Consumption (Units)',
                data: [usageA, usageB, usageC],
                backgroundColor: [
                    'rgba(107, 175, 150, 0.8)', // Type A (#6baf96)
                    'rgba(223, 140, 111, 0.8)', // Type B (#df8c6f)
                    'rgba(141, 154, 182, 0.8)'  // Type C (#8d9ab6)
                ],
                borderColor: [
                    'rgba(107, 175, 150, 1)',
                    'rgba(223, 140, 111, 1)',
                    'rgba(141, 154, 182, 1)'
                ],
                borderWidth: 1,
                outlierBackgroundColor: '#94a3b8',
                itemRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)'
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Electricity Consumption (Units)', color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    title: { display: true, text: 'Apartment Type (Category)', color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });
    // --- Detailed Insights Charts ---
    // Anomalies Chart (Top 5 consuming apartments vs Building Average)
    const sortedResidents = [...residents].sort((a, b) => b.usage - a.usage);
    const top5 = sortedResidents.slice(0, 5);
    const avgUsageTotal = residents.reduce((s, r) => s + r.usage, 0) / residents.length;
    
    const ctxAnomalies = document.getElementById('anomaliesChart').getContext('2d');
    new Chart(ctxAnomalies, {
        type: 'bar',
        data: {
            labels: top5.map(r => r.id),
            datasets: [
                {
                    label: 'Apartment Usage (kWh)',
                    data: top5.map(r => r.usage),
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: 4
                },
                {
                    label: 'Building Average',
                    data: [avgUsageTotal, avgUsageTotal, avgUsageTotal, avgUsageTotal, avgUsageTotal],
                    type: 'line',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Breakdown Chart
    const ctxBreakdown = document.getElementById('breakdownChart').getContext('2d');
    new Chart(ctxBreakdown, {
        type: 'doughnut',
        data: {
            labels: ['HVAC (45%)', 'Lighting (15%)', 'Appliances (25%)', 'Water Heating (15%)'],
            datasets: [{
                data: [45, 15, 25, 15],
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',  // HVAC
                    'rgba(250, 204, 21, 0.8)',  // Lighting
                    'rgba(59, 130, 246, 0.8)',  // Appliances
                    'rgba(16, 185, 129, 0.8)'   // Water
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } } },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
            }
        }
    });

    // --- NEW WIDGETS FUNCTIONALITY ---

    // 1. Search filter
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();

        // Filter resident grid
        document.querySelectorAll('.resident-item').forEach(item => {
            const text = item.innerText.toLowerCase();
            item.style.display = text.includes(term) ? 'flex' : 'none';
        });

        // Filter transparency table
        document.querySelectorAll('#transparencyTable tbody tr').forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });

    // 2. Export CSV
    const exportBtn = document.querySelector('.btn-primary');
    exportBtn.addEventListener('click', () => {
        const rows = document.querySelectorAll('#transparencyTable tr');
        let csvContent = "";

        rows.forEach(row => {
            const cols = row.querySelectorAll('th, td');
            const rowData = Array.from(cols).map(col => `"${col.innerText}"`).join(",");
            csvContent += rowData + "\r\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "energy_transparency.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // 3. Chart Downloads (More buttons)
    document.querySelectorAll('.chart-card').forEach(card => {
        const btn = card.querySelector('.more-btn');
        const canvas = card.querySelector('canvas');
        if (btn && canvas) {
            btn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `${canvas.id || 'chart'}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    });

    // 4. Overlays (Notifications & Settings)
    const btnNotif = document.getElementById('btn-notifications');
    const popNotif = document.getElementById('notifications-popover');

    btnNotif.addEventListener('click', (e) => {
        e.stopPropagation();
        popNotif.classList.toggle('hidden');
        document.getElementById('settings-modal').classList.add('hidden');
    });

    const btnSettings = document.getElementById('btn-settings');
    const modSettings = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');

    btnSettings.addEventListener('click', () => {
        modSettings.classList.remove('hidden');
        popNotif.classList.add('hidden');
    });

    closeSettings.addEventListener('click', () => {
        modSettings.classList.add('hidden');
    });

    // Close overlays externally
    document.addEventListener('click', (e) => {
        if (!popNotif.contains(e.target) && !btnNotif.contains(e.target)) {
            popNotif.classList.add('hidden');
        }
        if (reportModal && !reportModal.classList.contains('hidden') && !reportModal.contains(e.target) && !e.target.closest('.resident-item')) {
            reportModal.classList.add('hidden');
        }
    });

    // 5. Detailed Report Modal Logic
    const reportModal = document.getElementById('resident-report-modal');
    const closeReportBtn = document.getElementById('close-report');
    let dailyChartInstance = null;

    window.openReportModal = (resident) => {
        document.getElementById('report-apt-id').innerText = resident.id;
        document.getElementById('report-apt-type').innerText = `Type ${resident.type}`;
        document.getElementById('report-total-usage').innerText = `${resident.usage} kWh`;

        // Mock est cost
        let rate = 0.15; // 15 cents per kWh
        document.getElementById('report-est-cost').innerText = `$${(resident.usage * rate).toFixed(2)}`;

        let avg = resident.type === 'A' ? 450 : (resident.type === 'B' ? 300 : 180);
        let insight = resident.usage > avg
            ? `Usage is above the typical average for Type ${resident.type} (${avg} kWh). Consider energy saving strategies.`
            : `Great job! Usage is below the typical average for Type ${resident.type} (${avg} kWh).`;
        document.getElementById('report-insight-text').innerText = insight;

        // Overlay handling
        modSettings.classList.add('hidden');
        popNotif.classList.add('hidden');
        reportModal.classList.remove('hidden');

        // Draw Chart
        const ctxDaily = document.getElementById('dailyBreakdownChart').getContext('2d');
        if (dailyChartInstance) {
            dailyChartInstance.destroy();
        }

        dailyChartInstance = new Chart(ctxDaily, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Daily Usage (kWh)',
                    data: resident.daily,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    };

    if (closeReportBtn) {
        closeReportBtn.addEventListener('click', () => {
            reportModal.classList.add('hidden');
        });
    }

    // 6. Data Explorer Logic
    const explorerSelect = document.getElementById('explorerFileSelect');
    const explorerTableHead = document.getElementById('explorerTableHead');
    const explorerTableBody = document.getElementById('explorerTableBody');

    if (explorerSelect) {
        explorerSelect.addEventListener('change', async (e) => {
            const fileName = e.target.value;
            if (!fileName) return;

            explorerTableHead.innerHTML = '<th>Loading...</th>';
            explorerTableBody.innerHTML = '';

            try {
                Papa.parse(fileName, {
                    download: true,
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        const data = results.data;
                        if (!data || data.length === 0) {
                            explorerTableHead.innerHTML = '<th>No data found</th>';
                            return;
                        }

                        // Build headers
                        const headers = Object.keys(data[0]);
                        explorerTableHead.innerHTML = headers.map(h => `<th>${h}</th>`).join('');

                        // Build rows (limit to 500 to avoid freezing)
                        const limit = Math.min(data.length, 500);
                        let rowsHtml = '';
                        for (let i = 0; i < limit; i++) {
                            const row = data[i];
                            rowsHtml += '<tr>' + headers.map(h => `<td>${row[h] !== null ? row[h] : ''}</td>`).join('') + '</tr>';
                        }
                        
                        if (data.length > 500) {
                            rowsHtml += `<tr><td colspan="${headers.length}" style="text-align: center; color: var(--text-sec); font-style: italic;">... and ${data.length - 500} more rows truncated for performance.</td></tr>`;
                        }

                        explorerTableBody.innerHTML = rowsHtml;
                    },
                    error: function(err) {
                        console.error("Error exploring file:", err);
                        explorerTableHead.innerHTML = '<th>Error loading file</th>';
                    }
                });
            } catch (err) {
                console.error("Failed to explore data", err);
            }
        });
    }
});
