
* {
    box-sizing: border-box;
}

body {
    display: flex;
    justify-content: center;
    margin: 50px 0;
    background-color: #eaf4ff;
    font-family: sans-serif;
}

button,
input {
    font: inherit;
}

button {
    cursor: pointer;
}

.calendar {
    width: 500px;
    max-width: 100%;
    background-color: white;
    border-radius: 15px;
    padding: 15px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h2 {
    font-size: 22px;
}

.header button {
    font-size: 30px;
    border: none;
    background: none;
}

.week,
.days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
}

.week div {
    text-align: center;
    font-weight: bold;
    padding: 10px 0;
}

.day {
    min-width: 0;
    min-height: 90px;
    padding: 6px;
    border: 1px solid #ddd;
    cursor: pointer;
    overflow: hidden;
}

.day:hover {
    background-color: #f2f7ff;
}

.date-number {
    font-weight: bold;
    margin-bottom: 5px;
}

.schedule {
    font-size: 12px;
    background-color: #dbeeff;
    padding: 4px 5px;
    border-radius: 4px;
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.popup {
    display: none;
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    justify-content: center;
    align-items: center;
    padding: 15px;
    z-index: 100;
}

.popup-content {
    width: 350px;
    max-width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    background-color: white;
    padding: 25px;
    border-radius: 15px;
    position: relative;
    text-align: center;
}

.close {
    position: absolute;
    top: 8px;
    right: 12px;
    font-size: 25px;
    border: none;
    background: none;
}

#popupDate {
    padding: 0 20px;
}

#scheduleList {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 250px;
    overflow-y: auto;
    margin: 15px 0;
}

.schedule-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-align: left;
}

.schedule-item-text {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
}

.schedule-actions {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
}

.favorite-button,
.delete-button {
    border: none;
    border-radius: 5px;
    padding: 6px 8px;
}

.favorite-button {
    background-color: #fff4c2;
    color: #8a6800;
    font-size: 18px;
}

.delete-button {
    background-color: #e74c3c;
    color: white;
    font-size: 12px;
}

#scheduleInput {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
}

#saveSchedule {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 5px;
    background-color: #4a90e2;
    color: white;
}

#saveSchedule:hover {
    background-color: #357abd;
}

.empty-message {
    color: #888;
    font-size: 14px;
    padding: 10px;
}

@media (max-width: 540px) {
    body {
        margin: 15px 0;
    }

    .calendar {
        padding: 8px;
    }

    .header h2 {
        font-size: 18px;
    }

    .week div {
        font-size: 13px;
    }

    .day {
        min-height: 70px;
        padding: 3px;
    }

    .date-number {
        font-size: 12px;
    }

    .schedule {
        font-size: 10px;
        padding: 3px;
    }

    .popup-content {
        padding: 20px;
    }
}
