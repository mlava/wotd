const config = {
    tabTitle: "Word of the Day",
    settings: [
        {
            id: "wotd-rAPI-key",
            name: "RapidAPI Key",
            description: "Your API Key for RapidAPI from https://rapidapi.com/jayantur13/api/word-of-the-day2",
            action: { type: "input", placeholder: "Add RapidAPI API key here" },
        },
    ]
};

export default {
    onload: ({ extensionAPI }) => {
        extensionAPI.settings.panel.create(config);

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Words of the Day (Dictionary.com and Merriam Webster)",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please make sure to focus a block before importing the Word of the Day");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchWOTD(true, true, uid).then(async (blocks) => {
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: blocks[0].text.toString(), open: true } });

                    for (var i = 0; i < blocks[0].children.length; i++) {
                        var thisBlock = window.roamAlphaAPI.util.generateUID();
                        await window.roamAlphaAPI.createBlock({
                            location: { "parent-uid": uid, order: i + 1 },
                            block: { string: blocks[0].children[i].text.toString(), uid: thisBlock }
                        });
                    }
                });
            },
        });
        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Word of the Day (Dictionary.com)",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please make sure to focus a block before importing the Word of the Day");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchWOTD(true, false, uid).then(async (blocks) => {
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: blocks[0].text.toString(), open: true } });

                    var thisBlock = window.roamAlphaAPI.util.generateUID();
                    await window.roamAlphaAPI.createBlock({
                        location: { "parent-uid": uid, order: 1 },
                        block: { string: blocks[0].children[0].text.toString(), uid: thisBlock }
                    });
                });
            },
        });
        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Word of the Day (Merriam Webster)",
            callback: () => {
                const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                if (uid == undefined) {
                    alert("Please make sure to focus a block before importing the Word of the Day");
                    return;
                } else {
                    window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: "Loading...".toString(), open: true } });
                }
                fetchWOTD(false, true, uid).then(async (blocks) => {
                    await window.roamAlphaAPI.updateBlock(
                        { block: { uid: uid, string: blocks[0].text.toString(), open: true } });

                    var thisBlock = window.roamAlphaAPI.util.generateUID();
                    await window.roamAlphaAPI.createBlock({
                        location: { "parent-uid": uid, order: 1 },
                        block: { string: blocks[0].children[0].text.toString(), uid: thisBlock }
                    });
                });
            },
        });

        const args = {
            text: "WOTD",
            help: "Words of the Day (Dictionary.com and Merriam Webster)",
            handler: (context) => fetchWOTDSSB,
        };
        const args1 = {
            text: "WOTDDC",
            help: "Word of the Day (Dictionary.com)",
            handler: (context) => fetchWOTDDCSB,
        };
        const args2 = {
            text: "WOTDMW",
            help: "Word of the Day (Merriam Webster)",
            handler: (context) => fetchWOTDMWSB,
        };

        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.registerCommand(args);
            window.roamjs.extension.smartblocks.registerCommand(args1);
            window.roamjs.extension.smartblocks.registerCommand(args2);
        } else {
            document.body.addEventListener(
                `roamjs:smartblocks:loaded`,
                () =>
                    window.roamjs?.extension.smartblocks &&
                    window.roamjs.extension.smartblocks.registerCommand(args) &&
                    window.roamjs.extension.smartblocks.registerCommand(args1) &&
                    window.roamjs.extension.smartblocks.registerCommand(args2)
            );
        }

        function fetchWOTDSSB() {
            return fetchWOTD(true, true)
        }

        function fetchWOTDDCSB() {
            return fetchWOTD(true, false)
        }

        function fetchWOTDMWSB() {
            return fetchWOTD(false, true)
        }

        async function fetchWOTD(DC, MW, uid) {
            var rAPIkey, key;
            
            breakme: {
                if (!extensionAPI.settings.get("wotd-rAPI-key")) {
                    key = "API";
                    sendConfigAlert(key);
                    break breakme;
                } else {
                    rAPIkey = extensionAPI.settings.get("wotd-rAPI-key");
                }

                var myHeaders = new Headers();
                myHeaders.append("X-RapidAPI-Key", rAPIkey);
                myHeaders.append("X-RapidAPI-Host", "word-of-the-day2.p.rapidapi.com");

                var requestOptions = {
                    method: 'GET',
                    headers: myHeaders
                };

                let response = await fetch("https://word-of-the-day2.p.rapidapi.com/word/today", requestOptions);
                if (response.ok) {
                    let data = await response.json();
                    var headerString = "**Word of the Day:**";
                    var output = [];
                    var string = "__";
                    var string1 = "__";
                    var dcDate = data[1].date.split(", ");
                    let dcDate1 = dcDate[1].split(" ");
                    let dcDay = dcDate1[1];
                    let dcMonth = dcDate1[0];
                    dcMonth = getMonth(dcMonth);
                    let dcYear = dcDate[2];
                    let dcLink = "[Dictionary.com](https://www.dictionary.com/e/word-of-the-day/"+encodeURIComponent(data[1].word)+"-"+dcYear+"-"+dcMonth+"-"+dcDay+")";
                    var mwDate = data[2].date.split(", ");
                    let mwDate1 = mwDate[0].split(" ");
                    let mwDay = mwDate1[1];
                    let mwMonth = mwDate1[0];
                    mwMonth = getMonth(mwMonth);
                    let mwYear = mwDate[1];
                    let mwLink = "[Merriam Webster](https://www.merriam-webster.com/word-of-the-day/"+encodeURIComponent(data[2].word)+"-"+mwYear+"-"+mwMonth+"-"+mwDay+")";
                    
                    string += data[1].word;
                    string += "__\n\n";
                    string += data[1].mean;
                    string += "\n\n"+dcLink+"";
                    string1 += data[2].word;
                    string1 += "__\n\n";
                    string1 += data[2].mean;
                    string1 += "\n\n"+mwLink+"";
                    if (DC && MW) { // output both dictionary.com and Merriam Webster
                        headerString = "**Words of the Day:**";
                        output.push({ "text": string, });
                        output.push({ "text": string1, });
                    } else if (DC) { // output dictionary.com
                        output.push({ "text": string, });
                    } else if (MW) { // output Merriam Webster
                        output.push({ "text": string1, });
                    }
                    
                    return [
                        {
                            "text": headerString,
                            "children": output,
                        }
                    ];
                } else {
                    console.error(response);
                    alert("The call to the WOTD API failed!");
                    if (uid != undefined) {
                        await window.roamAlphaAPI.deleteBlock({ "block": { "uid": uid } });
                    }
                }
            }
        }
    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Words of the Day (Dictionary.com and Merriam Webster)'
        });
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Word of the Day (Dictionary.com)'
        });
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Word of the Day (Merriam Webster)'
        });
        if (window.roamjs?.extension?.smartblocks) {
            window.roamjs.extension.smartblocks.unregisterCommand("WOTD");
            window.roamjs.extension.smartblocks.unregisterCommand("WOTDDC");
            window.roamjs.extension.smartblocks.unregisterCommand("WOTDMW");
        };
    }
}

function sendConfigAlert(key) {
    if (key == "API") {
        alert("Please set your RapidAPI Key in the configuration settings via the Roam Depot tab.");
    }
}

function getMonth(dcMonth) {
    var monthNumber;
    if (dcMonth == "January") {
        monthNumber = "01"
    } else if (dcMonth == "February") {
        monthNumber = "02"
    } else if (dcMonth == "March") {
        monthNumber = "03"
    } else if (dcMonth == "April") {
        monthNumber = "04"
    } else if (dcMonth == "May") {
        monthNumber = "05"
    } else if (dcMonth == "June") {
        monthNumber = "06"
    } else if (dcMonth == "July") {
        monthNumber = "07"
    } else if (dcMonth == "August") {
        monthNumber = "08"
    } else if (dcMonth == "September") {
        monthNumber = "09"
    } else if (dcMonth == "October") {
        monthNumber = "10"
    } else if (dcMonth == "November") {
        monthNumber = "11"
    } else {
        monthNumber = "12"
    }
    return monthNumber;
}