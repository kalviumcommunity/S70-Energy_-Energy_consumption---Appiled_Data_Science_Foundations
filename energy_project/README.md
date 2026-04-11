# Apartment Energy Conservation Analysis
**Data Modeling Sprint | Problem: Energy Wastage & Billing Transparency**

## 📌 Project Overview
This project addresses the challenge of wide variance in apartment energy consumption, which often leads to billing disputes and resource wastage. By analyzing household usage patterns, we provide data-driven evidence to encourage conservation and ensure transparent billing.

## 🛠️ Tech Stack
- **Language:** Python 3.x
- **Data Handling:** Pandas, NumPy
- **Visualization:** Matplotlib, Seaborn
- **Environment:** Jupyter Notebook / Anaconda

## 🗂️ Data Modeling & Cleaning (Week 2)
To turn raw system logs into a household-level model, the following steps were taken:
- **Identifier Assignment:** Generated unique `apartment_id` (A0–A49) to track specific unit patterns.
- **Semantic Renaming:** Transformed vague features like `var2` into descriptive categories like `apartment_type`.
- **Temporal Modeling:** Converted timestamps into `datetime` objects to extract `hour` and `month` for peak-load analysis.
- **Integrity Checks:** Removed duplicate entries and verified 0 null values to ensure billing accuracy.

## 📊 Key Insights (Week 3)
- **Peak Wastage Hour:** Analysis identified **Hour 1 (1:00 AM)** as the peak consumption period building-wide.
- **Consumption by Type:** **Apartment Type B** shows the highest average usage, while **Type C** is the most efficient.
- **Temperature Correlation:** Established a direct link between external temperature and consumption spikes, helping explain high bills during weather extremes.

## 🚀 Final Recommendations (Week 4)
1. **Audit Hour 1 Usage:** Management should investigate automated systems or shared utilities that spike at 1:00 AM to reduce building-wide wastage.
2. **Transparency Reports:** Use the processed data to provide residents with "Peer Comparison" charts, showing their usage relative to the average for their apartment type.
3. **Targeted Conservation:** Focus energy-saving workshops on residents in Type B units, as they represent the highest potential for building-wide reduction.

---
