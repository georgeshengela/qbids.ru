const fs = require('fs');

// Read the auctions data
const data = JSON.parse(fs.readFileSync('/tmp/auctions.json', 'utf8'));
const upcoming = data.upcoming;

// Sort by startTime to get the next 5 chronologically
const sortedAuctions = upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

console.log('Next 5 upcoming auctions (by start time):');
sortedAuctions.slice(0, 5).forEach((auction, i) => {
    console.log(`${i+1}. ${auction.id} - ${auction.title.substring(0, 50)}... (starts: ${auction.startTime})`);
});

console.log('\nIDs to delete:');
sortedAuctions.slice(0, 5).forEach(auction => {
    console.log(auction.id);
});