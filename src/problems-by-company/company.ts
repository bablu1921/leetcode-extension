// Create a new variable to store all solutions
const allSolutions = [] as { id: number, title: string, url: string }[];
const solutions = [] as { id: number, title: string, url: string }[];

let companyName = 'Amazon';
const companies = [
    'Amazon', 'Apple', 'Facebook', 'Google', 'Microsoft', 'Netflix'
];

async function main() {
    chrome.storage.local.get('clickedCompany', function (data: { [key: string]: any; }) {
        companyName = data.clickedCompany;
        const title: HTMLElement | null = document.getElementById('title');
        if (title) title.textContent = companyName;
        document.title = companyName + ' Questions';
        addCompanyProblems('Frequency'); // Change this line to sort by frequency by default
    });

    document.getElementById('#')?.addEventListener('click', () => sortBy('#'));
    document.getElementById('Difficulty')?.addEventListener('click', () => sortBy('Difficulty'));
    document.getElementById('Title')?.addEventListener('click', () => sortBy('Title'));
    document.getElementById('Acceptance')?.addEventListener('click', () => sortBy('Acceptance'));
    document.getElementById('Frequency')?.addEventListener('click', () => sortBy('Frequency'));
    document.getElementById('dateSelect')?.addEventListener('change', (event) => {
        const selectedFrequency = (event.target as HTMLSelectElement).value;
        updateFrequency(selectedFrequency);
    });


    addNavbarLinks();
    await addCompaniesToSelect();
}


function addNavbarLinks() {
    const navbar = document.getElementById('navbar');
    companies.forEach((company) => {
        const button = document.createElement('button');

        button.onclick = () => {
            chrome.storage.local.set({ clickedCompany: company }, () => {
                location.reload();
            });
        };
        button.onmouseover = () => {
            button.style.color = 'orange';
            button.style.cursor = 'pointer';
        };
        button.onmouseout = () => {
            button.style.color = 'white';
        };
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';

        const icon = document.createElement('img');
        icon.src = `https://logo.clearbit.com/${company.toLowerCase().replace(/\s/g, '')}.com`;
        icon.style.height = '20px';
        icon.style.width = '20px';
        icon.style.marginRight = '20px';
        button.appendChild(icon);

        button.style.color = '#fff';
        button.style.minWidth = '130px';
        button.style.height = '40px';
        button.style.padding = '5px';
        button.style.backgroundColor = '#373737';
        button.style.borderRadius = '10px';
        button.style.fontSize = '12px';

        const companyName = document.createTextNode(`${company}`);
        button.appendChild(companyName);
        navbar?.appendChild(button);
    });
}

interface Company {
    name: string;
}

interface Question {
    title: string;
    frontend_id: number;
    companies?: Company[];
}

interface LeetcodeProblems {
    questions: Question[];
}

let minFrequency = Number.MAX_SAFE_INTEGER;
let maxFrequency = 0;


async function updateFrequency(selectedFrequency: string) {
    // Clear the existing table
    const table = document.getElementById('solutionTable') as HTMLTableElement;
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Reset min and max frequency for the selected range
    minFrequency = Number.MAX_SAFE_INTEGER;
    maxFrequency = 0;

    // Create a new array to hold the solutions with the selected frequency
    const updatedSolutions = [];

    // Update the frequency values in the solutions array
    const data = await new Promise<{ companyProblems: any }>((resolve) => {
        chrome.storage.local.get('companyProblems', function (data) {
            resolve(data);
        });
    });

    const companyProblems = data.companyProblems[companyName];
    if (Array.isArray(companyProblems)) {
        allSolutions.forEach((solution, index) => { // Iterate over allSolutions
            // Check if the selected frequency value exists for the problem
            if (companyProblems[index].hasOwnProperty(selectedFrequency)) {
                const freqValue = companyProblems[index][selectedFrequency];
                solution['frequency'] = freqValue;

                // Update min and max frequency for the selected range
                if (freqValue < minFrequency) minFrequency = freqValue;
                if (freqValue > maxFrequency) maxFrequency = freqValue;

                // Add the solution to the updated solutions array
                updatedSolutions.push(solution);
            }
        });
    }

    // Replace the solutions array with the updated solutions
    solutions.length = 0;
    solutions.push(...updatedSolutions);

    // Rebuild the table with updated frequency values
    rebuildTable();
}


function addCompanyProblems(sortMethod: string) {
    chrome.storage.local.get(['companyProblems', 'leetcodeProblems'], function (data) {
        const companyProblems = data.companyProblems[companyName];
        const leetcodeProblems = data.leetcodeProblems.questions;

        // Reset max and min frequency
        maxFrequency = 0;
        minFrequency = Number.MAX_SAFE_INTEGER;

        // Check if companyProblems is an array before proceeding
        if (Array.isArray(companyProblems)) {
            companyProblems.forEach((problem) => {
                const correspondingLeetcodeProblem = leetcodeProblems.find(q => q.frontend_id === problem.id); // Find the corresponding problem
                // Populate allSolutions instead of solutions
                allSolutions.push({
                    id: problem.id,
                    title: problem.title,
                    url: `https://leetcode.com/problems/${problem.title.replace(/\s/g, '-')}/`,
                    frequency: problem.freq_alltime,
                    difficulty: correspondingLeetcodeProblem?.difficulty_lvl, // Use the defined variable
                    acceptance: correspondingLeetcodeProblem?.acceptance, // Use the defined variable
                });

                // Update min and max frequency
                if (problem.freq_alltime < minFrequency) minFrequency = problem.freq_alltime;
                if (problem.freq_alltime > maxFrequency) maxFrequency = problem.freq_alltime;
            });
        }

        // Initialize solutions with all problems initially
        solutions.length = 0;
        solutions.push(...allSolutions);

        // Rebuild the table with sorted solutions
        rebuildTable();
    });
}


// Function to rebuild the table with sorted solutions
function rebuildTable() {
    const table = document.getElementById('solutionTable') as HTMLTableElement;
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    solutions.forEach((solution) => {
        const row = table.insertRow(-1);
        row.insertCell(0).innerText = solution.id.toString();

        // Get the difficulty level
        const difficulty = solution.difficulty;
        const difficultyCell = row.insertCell(1);
        let difficultyText = '';
        let color = '';

        // Define the difficulty text and background color
        if (difficulty === 1) {
            difficultyText = 'Easy';
            color = 'lightgreen';
        } else if (difficulty === 2) {
            difficultyText = 'Medium';
            color = 'orange';
        } else {
            difficultyText = 'Hard';
            color = 'red';
        }

        difficultyCell.innerText = difficultyText || 'N/A';
        difficultyCell.style.color = color;
        difficultyCell.style.fontWeight = 'bold';
        difficultyCell.style.fontSize = '12px';
        difficultyCell.style.borderRadius = '5px'; // Apply border radius

        row.insertCell(2).innerHTML = `<a href="${solution.url}" target="_blank">${solution.title}</a>`;

        // Add acceptance rating
        const acceptanceCell = row.insertCell(3);
        acceptanceCell.innerText = (solution.acceptance ? (solution.acceptance * 100).toFixed(2) + '%' : 'N/A'); // New column for acceptance
        acceptanceCell.style.fontSize = '12px';

        // Add frequency as a bar
        const frequencyCell = row.insertCell(4);
        const bar = document.createElement('div');
        const width = ((solution.frequency - minFrequency) / (maxFrequency - minFrequency)) * 100;
        bar.style.width = Math.min(width, 100) + '%';
        bar.style.height = '10px';
        bar.style.backgroundColor = 'lightgreen';
        bar.style.borderRadius = '10px';
        bar.style.border = '1px solid lightgreen';
        frequencyCell.appendChild(bar);
    });
}

async function addCompaniesToSelect() {
    const companySearch = document.getElementById('companySearch') as HTMLInputElement;
    const companyList = document.getElementById('companyList') as HTMLDataListElement;
    let companies = [];

    const data = await new Promise<{ companyProblems: any }>((resolve) => {
        chrome.storage.local.get('companyProblems', function (data) {
            resolve(data);
        });
    });

    const companyProblems = data.companyProblems;
    // Add all the keys to the set
    Object.keys(companyProblems).forEach((company) => {
        if (company) {
            companies.push(company);
        }
    });

    // Event when the "Enter" key is pressed or an option is selected from the dropdown
    const handleSelection = () => {
        const inputValue = companySearch.value;
        // Find the selected company in a case-insensitive manner
        const selectedCompany = Array.from(companies).find(
            (company) => company.toLowerCase() === inputValue.toLowerCase()
        );
        if (selectedCompany) {
            chrome.storage.local.set({ clickedCompany: selectedCompany }, () => {
                location.reload();
            });
        }
    };

    companySearch.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleSelection();
        }
    });

    companySearch.addEventListener('change', handleSelection);

    const sortedCompanies = companies.sort();

    sortedCompanies.forEach((company) => {
        const option = document.createElement('option');
        option.value = company;
        companyList.appendChild(option);
    });
}


// Keep track of the sorting order for each column
const sortOrders = {
    '#': false,
    'Difficulty': false,
    'Title': false,
    'Acceptance': false,
    'Frequency': false,
};

function sortBy(column: string) {
    // Toggle the sort order for the selected column
    sortOrders[column] = !sortOrders[column];

    // Clear the existing table
    const table = document.getElementById('solutionTable') as HTMLTableElement;
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Sort the solutions based on the selected column
    switch (column) {
        case '#':
            solutions.sort((a, b) => (sortOrders[column] ? a.id - b.id : b.id - a.id));
            break;
        case 'Difficulty':
            solutions.sort((a, b) => (sortOrders[column] ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
            solutions.sort((a, b) => (sortOrders[column] ? a.difficulty - b.difficulty : b.difficulty - a.difficulty));
            break;
        case 'Title':
            solutions.sort((a, b) => (sortOrders[column] ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
            break;
        case 'Acceptance':
            solutions.sort((a, b) => (sortOrders[column] ? b.acceptance - a.acceptance : a.acceptance - b.acceptance));
            break;
        case 'Frequency':
            solutions.sort((a, b) => (sortOrders[column] ? b.frequency - a.frequency : a.frequency - b.frequency));
            break;
        // Add other cases if needed
    }

    // Rebuild the table with sorted solutions
    rebuildTable();
}

/* Run the script */
main();