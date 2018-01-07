var socket = io();

const maxHistory = 16;

Chart.defaults.global.legend.display = false;



// Master meta config
var peers = {};

var peerTemplate = {
  'el': '#peers',
  'template':  `
<div class="row placeholders">
    <peer v-for="peer in peers" :key="peer.address" v-bind:state=peer></peer>
</div>
`,

    data : {
        peers: [
        ]
    }
};

var vm = new Vue(peerTemplate);

socket.on('updatePeerList', function (peers, fn) {
    // Update list
    for (var i = 0; i < vm.peers.length; ++i) {
        var found = false;

        for (var j = 0; j < peers.length; ++j) {
            if (vm.peers[i].address === peers[j].address) {
                found = true;
                break;
            }
        }

        if (!found) {
            vm.peers.splice(i, 1);
        }
    }

    vm.peers.sort(function (a, b) {
        return b.numberOfNewTransactions - a.numberOfNewTransactions;
    });

    fn({ result: true });
});

socket.on('peerDeleted', function (info) {
    var infoAddress = info.address.split('//')[1];

    // Delete matching peer
    for (var i = 0; i < vm.peers.length; ++i) {
        if (vm.peers[i].address === infoAddress) {
            return vm.peers.splice(i, 1);
        }
    }
});

socket.on('peerInfo', function (info) {
    var item = null;

    for (var i = 0; i < vm.peers.length; ++i) {
        if (vm.peers[i].address === info.address) {
            item = vm.peers[i];
            break;
        }
    }

    if (item) {
        var time = new Date();

        var seconds = time.getSeconds();
        var minutes = time.getMinutes();
        var hour    = time.getHours();

        var obj = Object.assign({}, item.history);
        obj.labels.push('' + hour + ':' + minutes + ':' + seconds);

        if (obj.labels.length > maxHistory) {
            obj.labels.shift();
        }

        obj.datasets[0].data.push(info.numberOfAllTransactions - item.numberOfAllTransactions);

        if (obj.datasets[0].data.length > maxHistory) {
            obj.datasets[0].data.shift();
        }

        obj.datasets[1].data.push(info.numberOfNewTransactions - item.numberOfNewTransactions);

        if (obj.datasets[1].data.length > maxHistory) {
            obj.datasets[1].data.shift();
        }

        obj.datasets[2].data.push(info.numberOfSentTransactions - item.numberOfSentTransactions);

        if (obj.datasets[2].data.length > maxHistory) {
            obj.datasets[2].data.shift();
        }

        Object.assign(item, info);

        Vue.set(item, 'history', obj);
    } else {
        info.history = {
            labels: [],
            datasets: [
                {
                    label: 'Rec TX',
                    borderColor: '#333',
                    backgroundColor: 'rgba(0,0,0,0)',
                    data: []
                },
                {
                    label: 'New TX',
                    borderColor: '#5cb85c',
                    backgroundColor: 'rgba(0,0,0,0)',
                    data: []
                },
                {
                    label: 'Sent TX',
                    borderColor: '#03a9f4',
                    backgroundColor: 'rgba(0,0,0,0)',
                    data: []
                },
            ]
        };

        vm.peers.push(Object.assign({}, info));
    }

//    vm.peers.sort(function (a, b) {
//        return b.numberOfNewTransactions - a.numberOfNewTransactions;
//    });
});


socket.on('nodeInfo', function (info) {
    var favicon = new Favico();
    var sync    = document.getElementById('sync-favicon');
    var nosync  = document.getElementById('no-sync-favicon');

    if ((info.latestMilestoneIndex + exp) === info.latestSolidSubtangleMilestoneIndex) {
        favicon.image(sync);
    } else {
        favicon.image(nosync);
    }
});

socket.on('result', function (info) {
    swal('Response', info, 'info');
});

exp = 0;
