import { Component } from 'react';
import axios from "axios";
import DataGrid from 'react-data-grid';

const monthMapNum = { 0: "01", 1: "02", 2: "03", 3: "04", 4: "05", 5: "06", 6: "07", 7: "08", 8: "09", 9: "10", 10: "11", 11: "12" };
const monthMapString = { 0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "July", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec" };
let orgList = [];
let monthYearList = [[], []];

const columns = [
    { key: "nu", name: "No." },
    { key: 'org', name: 'ORGANISATION' },
];

const rows = [
    // { org: 123.com, yearmonth: 123 },
];

// takes parameter in seconds
const convertToYearMonthDay = function (time) {
    let remaining = time;
    let month = Math.floor(time / (60 * 60 * 24 * 30));
    // this is the remaining days
    remaining %= 60 * 60 * 24 * 30;
    let days = Math.floor(remaining / (60 * 60 * 24));
    // this is remaining hours
    remaining %= 60 * 60 * 24;
    let hours = Math.floor(remaining / (60 * 60));
    remaining %= 60 * 60;
    let minutes = Math.floor(remaining / 60);
    remaining %= 60;
    console.log([month, days, hours, minutes, remaining])

    return (month ? `${month} M` : "") + (days ? `${days} D` : "") + (hours ? `${hours} h` : "") + (minutes ? `${minutes} m` : "") + (remaining ? `${remaining} s` : "")
}

// this function gives the list of orgs and all yearmonth string 
const extractDateRangeOrg = function (organisationRespMap) {
    const date = new Date();
    let mindate = `${date.getFullYear()}${date.getMonth() + 1}`
    let maxdate = "197001";
    // go over the keys to find the range of year and months 
    // also store the names of all the orgs for ease of use
    for (const [org, obj] of Object.entries(organisationRespMap)) {
        // store org in the list of orgs
        orgList.push(org)
        for (const [yearMonth, value] of Object.entries(obj)) {
            if (yearMonth < mindate) {
                mindate = yearMonth;
            }
            if (yearMonth > maxdate) {
                maxdate = yearMonth;
            }
        }
    }
    let [minYear, minMonth] = [Number(mindate.slice(0, 4)), Number(mindate.slice(4, 6))]
    let tempYear = minYear;
    let tempMonth = minMonth - 1;
    let stringYearMonth = mindate;
    // generate the list of all the yearmonth string in the range
    // also generate the month year naming 
    while (stringYearMonth <= maxdate) {
        columns.push({ key: stringYearMonth, name: `${tempYear}${monthMapString[tempMonth]}` });
        monthYearList[0].push(stringYearMonth);
        monthYearList[1].push(`${tempYear}${monthMapString[tempMonth]}`);
        tempMonth = (tempMonth + 1) % 12;
        if (tempMonth == 0) {
            tempYear += 1;
        }
        stringYearMonth = `${tempYear}${monthMapNum[tempMonth]}`;
    }
    // console.log("Organisations: ", orgList);
    console.log("MonthYear List:", monthYearList);
    console.log("Columns: ", columns);
    return [orgList, monthYearList];
}

// this handles the pagination request
const populateRowColumn = function (responseTimes, from, to) {
    for (let i = from; i < to; i++) {
        let tempRow = {};
        tempRow["nu"] = i + 1;
        tempRow['org'] = orgList[i];
        console.log("Organisation is: ", orgList[i]);
        for (let j = 0; j < monthYearList[0].length; j++) {
            // console.log(`${monthYearList[0][j]}`);
            if (responseTimes[orgList[i]].hasOwnProperty(monthYearList[0][j])) {
                // console.log(`${monthYearList[0][j]}: ${responseTimes[orgList[i]][monthYearList[0][j]]} #END`);
                tempRow[monthYearList[0][j]] = convertToYearMonthDay(responseTimes[orgList[i]][monthYearList[0][j]]);
            } else {
                // console.log(`${monthYearList[0][j]}: NA`);
                tempRow[monthYearList[0][j]] = "NA";
            }
        }
        rows.push(tempRow);
    }
}

class ResponseTimes extends Component {

    constructor(props) {
        super(props)

        this.state = {
            rows: [],
            columns: []
        }
    }

    componentDidMount() {
        console.log("ResponseTimes componentDidMount()");
        axios.get("http://localhost:4300/api/email_reply_time_table")
            .then(response => {
                let responseTimes = response.data.message;
                extractDateRangeOrg(response.data.message);
                populateRowColumn(responseTimes, 10, 20);
                // change of state
                this.setState({
                    rows: rows,
                    columns: columns
                });
            })
    }

    render() {
        const { columns, rows } = this.state;
        return (
            <DataGrid columns={columns} rows={rows} />
        )
    }
}

export default ResponseTimes;