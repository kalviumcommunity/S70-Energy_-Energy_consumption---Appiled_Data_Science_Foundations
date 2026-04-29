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
# Apartment Energy Management: Machine Learning Pipeline

## Sprint 4 Overview
This repository contains an end-to-end machine learning solution designed to predict apartment electricity consumption. The project transitions raw building sensor logs into a predictive model to help building management identify energy wastage and anticipate load. 

**Current Phase:** Week 1 - Problem Definition & Data Preparation

---

## Week 1: Problem Definition & Data Preparation

### 1. Problem Statement
The objective of this project is to predict the continuous numerical value of future electricity consumption for individual apartments based on temporal and environmental factors. 
* **Machine Learning Task:** Regression

### 2. Feature Selection & Target Variable
Through semantic renaming and feature engineering in the previous sprint, we extracted meaningful entities from generic system logs. The model relies on the following structure:

* **Target Variable (y):** `electricity_consumption` (formerly `var1`) - The continuous target variable we are training the model to predict.
* **Features (X):** * `hour` (Engineered from `datetime` to capture daily peak usage cycles, specifically 1:00 AM spikes)
  * `month` (Engineered from `datetime` to capture seasonal trends)
  * `temperature` (Core environmental driver of heating/cooling systems)
  * `apartment_type` (formerly `var2` - Categorical baseline for expected consumption)

### 3. Data Splitting Strategy
To ensure the model learns generalized patterns rather than memorizing historical data, the dataset was divided using `scikit-learn`'s `train_test_split`.

* **Training Set:** 80% (21,113 records) - Used strictly for model training.
* **Testing Set:** 20% (5,279 records) - Held out completely for unbiased model evaluation.
* **Random State:** 42 (Set for reproducibility across team environments).

### 4. Assumptions & Limitations (Week 1)
* **Assumption:** The distribution of apartment types in the training set matches the real-world building distribution.
* **Limitation:** The model currently relies heavily on a single environmental factor (temperature); sudden anomalies not tied to temperature or time may not be captured.

## Week 2: Feature Engineering & Baseline Model

### 1. Preprocessing Pipeline
Machine learning algorithms require numerical input. The categorical feature `apartment_type` (which contained values like 'A', 'B', and 'C') was transformed using **One-Hot Encoding** (`pd.get_dummies`). This created binary columns, allowing the mathematical models to process the apartment categories without inferring false numerical relationships.

### 2. Baseline Model Performance
A basic **Linear Regression** model was trained on the 80% training set to establish an absolute performance floor.
* **Linear Regression R-squared ($R^2$):** 0.0117 (1.17%)
* **Insight:** The extremely low score indicates that the relationship between time/temperature and energy consumption is highly non-linear. A straight-line approach fails to capture the "U-shape" of temperature impacts (heating when cold vs. cooling when hot) and the cyclical nature of daily hours. This established the necessity for tree-based models.

---

## Week 3: Advanced Models & Optimization

To capture the non-linear patterns missed by the baseline model, we trained two advanced, tree-based algorithms. 

### 1. Model Comparison & Evaluation
* **Decision Tree Regressor R-squared ($R^2$):** -0.1817
    * *Insight:* The negative score indicates severe **overfitting**. Without structural limits, the single Decision Tree grew too complex, perfectly memorizing the training data but failing to generalize to the hidden test data.
* **Gradient Boosting Regressor R-squared ($R^2$):** 0.0603
    * *Insight:* By utilizing an ensemble approach (building hundreds of shallow, course-correcting trees), Gradient Boosting completely resolved the overfitting issue of the single Decision Tree and outperformed the Linear Regression baseline.

### 2. Model Selection
**Gradient Boosting** was selected as the final model architecture due to its superior ability to handle the non-linear relationships in weather and time data without overfitting.

### 3. Next Steps (Moving to Week 4)
* Perform **Hyperparameter Tuning** (via GridSearch or RandomizedSearch) to optimize the Gradient Boosting model and improve the current 6% accuracy.
* Export the finalized, tuned model using `pickle`.
* Deploy the predictive model via a **Streamlit** web application for real-time inference.

 --- 


