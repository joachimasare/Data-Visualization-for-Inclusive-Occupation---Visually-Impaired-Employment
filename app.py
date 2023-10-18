from flask import Flask, jsonify, render_template
from flask_cors import CORS
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)
CORS(app)
# Load preprocessed data from previous code
data = pd.read_csv('all_blind_soc_skills.csv')  

# Define SOC groups - all 22 major SOC groups. made a dict of first two digits and group
soc_groups = {
    '11': 'Management',
    '13': 'Business and Financial Operations',
    '15': 'Computer and Mathematical',
    '17': 'Architecture and Engineering',
    '19': 'Life, Physical, and Social Science',
    '21': 'Community and Social Service',
    '23': 'Legal Occupations',
    '25': 'Educational Instruction and Library',
    '27': 'Arts, Design, Entertainment, Sports, and Media',
    '29': 'Healthcare Practitioners and Technical',
    '31': 'Healthcare Support',
    '33': 'Protective Service',
    '35': 'Food Preparation and Serving Related',
    '37': 'Building and Grounds Cleaning and Maintenance',
    '39': 'Personal Care and Service',
    '41': 'Sales and Related',
    '43': 'Office and Administrative Support',
    '45': 'Farming, Fishing, and Forestry',
    '47': 'Construction and Extraction',
    '49': 'Installation, Maintenance, and Repair',
    '51': 'Production',
    '53': 'Transportation and Material Moving'
}

# Map SOC codes to SOC groups
data['SOC Group'] = data['SOC Code'].apply(lambda x: soc_groups[x.split('-')[0]])

# Additional data preprocessing here...

# Compute similarity matrix
skills_cols = [col for col in data.columns if '_IM' in col or '_LV' in col]
skills_data = data[skills_cols]
#print(skills_data)
similarity_matrix = cosine_similarity(skills_data)
#print(similarity_matrix)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/job-search-sighted')
def job_search_sighted():
    return render_template('job_search_sighted.html')

@app.route('/explore')
def explore():
    return render_template('explore.html')

@app.route('/occupations', methods=['GET'])
def get_occupations():
    occupations = data[['SOC Code', 'SOC Group', 'Blind Employed', 'Occupational Title_IDB', 'Occupational Title_BLS', 'Employment', 'Projected Growth']].copy()
    occupations['Occupational Title'] = np.where(occupations['Blind Employed'] == 1, 
                                                 occupations['Occupational Title_IDB'], 
                                                 occupations['Occupational Title_BLS'])
    occupations['Employment(2022)'] = occupations['Employment']
    occupations['Projected Growth'] = occupations['Projected Growth'].astype(int)
    occupations = occupations[['SOC Code', 'SOC Group', 'Blind Employed', 'Occupational Title', 'Employment(2022)', 'Projected Growth']]
    occupations = occupations.where(pd.notna(occupations), None)
    occupations_dict = occupations.to_dict(orient='records')
    return jsonify(occupations_dict)

@app.route('/similar_occupations/<soc_code>', methods=['GET'])
def get_similar_occupations(soc_code):
    idx = data[data['SOC Code'] == soc_code].index[0]
    similar_idx = np.argsort(similarity_matrix[idx])[-9:-1][::-1]
    similar_occupations = data.iloc[similar_idx][['SOC Code', 'Occupational Title_IDB', 'Occupational Title_BLS', 'Blind Employed']].copy()
    similar_occupations['Occupational Title'] = np.where(similar_occupations['Blind Employed'] == 1, 
                                                         similar_occupations['Occupational Title_IDB'], 
                                                         similar_occupations['Occupational Title_BLS'])
    similar_occupations = similar_occupations[['SOC Code', 'Occupational Title']]
    similar_occupations = similar_occupations.where(pd.notna(similar_occupations), None)
    
    # Create a list to store similar occupations with similarity scores
    similar_occupations_list = []
    
    # Calculate similarity scores and add to the list
    similarity_scores = similarity_matrix[idx][similar_idx]
    for i, occupation_record in enumerate(similar_occupations.to_dict(orient='records')):
        occupation_record['Similarity Score'] = similarity_scores[i]
        similar_occupations_list.append(occupation_record)
    
    return jsonify(similar_occupations_list)


@app.route('/occupation_details/<soc_code>', methods=['GET'])
def get_occupation_details(soc_code):
    occupation = data[data['SOC Code'] == soc_code].copy()
    occupation = occupation.where(pd.notna(occupation), None)
    occupational_title = occupation['Occupational Title_IDB'].values[0] if occupation['Blind Employed'].values[0] == 1 else occupation['Occupational Title_BLS'].values[0]
    details = {
        'SOC Code': occupation['SOC Code'].values[0],
        'Occupational Title': occupational_title,
        'Employment(2022)': int(occupation['Employment'].values[0]),
        'Projected Employment(2032)': int(occupation['Projected Employment'].values[0]),
        'Projected Growth': int(occupation['Projected Growth'].values[0]),
        'Projected Annual Job Openings': int(occupation['Projected Annual Job Openings'].values[0]),
        'Job Market Share': "{:.2f}".format(float((occupation['Employment'].values[0] / 147886000) * 100))
    }
    return jsonify(details)


if __name__ == "__main__":
    app.run(debug=True)