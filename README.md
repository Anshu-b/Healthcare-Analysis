# 🚀 The Big Data Sugar Rush: Analyzing Glycemic Trends

📊 1. Data Sampling and Initial Inspection

To kickstart the data analysis, we extracted a random sample of 2,000 records from a
random sample of 8 participants from the pre-cleaned dataset
that is depicted as cleaned_data.csv in our raw data folder,
ensuring a balanced and representative subset for efficient processing. 🧐
This is due to the fact that we wanted to ensure the most accurate, representative
sample from the original population of 16 participants and make sure the data
that we plotted is free from confounds and sampling bias, which could severely
misconstrue the true value of the data that we collected and analyzed. 📉

We also took care of missing values that may impact the plotted data later on
through the utilization of several vectorized operations in Pandas, such as dropna(), fillna(), etc.
A quick scan for these missing values in crucial columns like date and time_of_day revealed gaps that
needed strategic imputations, such as median and mean imputation, to maintain the overall dataset’s integrity.



⏳ 2. Handling Missing and Inconsistent Timestamps

We converted all date and time-related fields into a
standardized datetime format using pd.to_datetime(), ensuring smooth processing. ⏱️
Any inconsistencies were gracefully handled by several vectorized
operations in Pandas, such as forward-filling (ffill) and backward-filling (bfill)
missing values, preventing unwanted data gaps. 🛠️

For time_end, missing values were intelligently inferred
by adding one hour to time_begin, keeping the temporal logic intact. 🕐
To further refine time_of_day, we transformed it into an easy-to-understand
numerical format (minutes from midnight), then calculated the dataset-wide mean,
and finally used it to fill missing values systematically, ensuring both accuracy and practicality.



🎲 3. Randomized Time Augmentation for Missing Values

To introduce natural variation and avoid synthetic patterns, we randomly generated
time_of_day values between 00:00 and 11:59 for missing entries. 🎰
This injects more realistic randomness into the dataset, making it more dynamic and flexible
to detect anomalies and unusual patterns that may not otherwise be readily observed
in data with missing values. 📊 This also maintains the original distribution of data that we had.



🔄 4. Unification and Optimization of Timestamp Variables

Since the dataset contained multiple timestamp columns (timestamp_x and timestamp_y),
we merged them intelligently using combine_first(), prioritizing the most complete data. 🔗
After dropping redundant columns, we chronologically sorted the dataset by timestamp,
setting it up for seamless analysis.



🎯 5. Final Thoughts and Parting Ideas

Through these rigorous yet thoughtfully designed preprocessing steps, we transformed a noisy dataset
into a clean, structured, and analysis-ready powerhouse.

These optimizations ensure data integrity, reduce bias, and prepare the dataset for deeper
machine-learning insights, making it job-ready and proof of strong data science capabilities. 💼✨

