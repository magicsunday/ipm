var systemTemplate = {
    el: '#systeminfo',
    template: `
<div class="row">
    <div class="col-lg-6">
        <div class="card mb-3" v-bind:class="[peerStatus === 'synchronous' ? 'border-success' : 'border-danger']">
            <div class="card-header" v-bind:class="[peerStatus === 'synchronous' ? 'bg-success' : 'bg-danger']">
                <i class="fa fa-bell fa-fw"></i> System info
            </div>
            <div class="list-group list-group-flush small">
                <a href="#" class="list-group-item list-group-item-action">
                    <i class="fa fa-check fa-fw"></i> Status
                    <span class="float-right text-muted small">
                        <em>{{peerStatus}}</em>
                    </span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                    <i class="fa fa-comment fa-fw"></i> IRI version
                    <span class="float-right text-muted small">
                        <em>{{nodeInfo.appVersion}}</em>
                    </span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                    <i class="fa fa-group fa-fw"></i> Neighbors
                    <span class="float-right text-muted small">
                        <em>{{nodeInfo.neighbors}}</em>
                    </span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                    <i class="fa fa-info fa-fw"></i> Latest milestone index
                    <span class="float-right text-muted small">
                        <em>{{nodeInfo.latestMilestoneIndex}}</em>
                    </span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                    <i class="fa fa-tasks fa-fw"></i> Latest milestone
                    <span class="float-right text-muted small">
                        <em>{{nodeInfo.latestMilestone}}</em>
                    </span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                    <i class="fa fa-info fa-fw"></i> Latest solid milestone index
                    <span class="float-right text-muted small">
                        <em>{{nodeInfo.latestSolidSubtangleMilestoneIndex}}</em>
                    </span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                    <i class="fa fa-tasks fa-fw"></i> Latest solid milestone
                    <span class="float-right text-muted small">
                        <em>{{nodeInfo.latestSolidSubtangleMilestone}}</em>
                    </span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                    <i class="fa fa-bolt fa-fw"></i> Tips
                    <span class="float-right text-muted small">
                        <em>{{nodeInfo.tips}}</em>
                    </span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                    <i class="fa fa-exchange fa-fw"></i> Transactions to request
                    <span class="float-right text-muted small">
                        <em>{{nodeInfo.transactionsToRequest}}</em>
                    </span>
                </a>
            </div>
        </div>
    </div>
</div>
`,
/*
    <div class="row-col light-blue-500 m-b-lg">
        <div class="col-xs-4">
            <div class="p-a-md">
                <h5>IRI Version </h5>
                <h3 class="_700 m-y">{{nodeInfo.appVersion}}</h3>
                <h5 class="_500">Neighbours</h5>
                <div class="h3 _700 m-y">
                    {{nodeInfo.neighbors}} &nbsp; <a v-on:click="showNeighbors"><span class="h5">Show List</span></a>
                </div>
                <h5>Add a new Peer</h5>
                <div class="row">
                    <div class="col-lg-9">
                        <input type="text" v-model="address" placeholder="E.g. udp://11.22.33.44:18400" class="form-control">
                    </div>
                    <div class="col-lg-3">
                        <button type="button" v-on:click="addPeer" class="btn btn-success">Add Peer</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-xs-8 dker">
            <div class="p-a-md">
                <h5>Latest Milestone Index:</h5>
                <h3 class="_700 m-y">
                    {{nodeInfo.latestMilestoneIndex}} <span class="h6">({{nodeInfo.latestMilestone}})</span>
                </h3>
                <h5>Latest Solid Milestone Index:</h5>
                <h3 class="_700 m-y">
                    {{nodeInfo.latestSolidSubtangleMilestoneIndex}}<span class="h6">({{nodeInfo.latestSolidSubtangleMilestone}})</span>
                </h3>
                <div class="h5">
                    <strong>Tips:</strong>
                    {{nodeInfo.tips}}
                </div>
                <div class="h5">
                    <strong>Transactions to Request:</strong>
                    {{nodeInfo.transactionsToRequest}}
                </div>
            </div>
        </div>
    </div>
</div>
`,
*/
    data : {
        address: '',
        nodeInfo : {
            appName: 'IRI Mainnet',
            appVersion: '1.4.1.4',
            jreAvailableProcessors: 1,
            jreFreeMemory: 0,
            jreVersion: '1.8.0',
            jreMaxMemory: 0,
            jreTotalMemory: 0,
            latestMilestone: '999999999999999999999999999999999999999999999999999999999999999999999999999999999',
            latestMilestoneIndex: 0,
            latestSolidSubtangleMilestone: '999999999999999999999999999999999999999999999999999999999999999999999999999999999',
            latestSolidSubtangleMilestoneIndex: 0,
            neighbors: 0,
            packetsQueueSize: 0,
            time: 0,
            tips: 0,
            transactionsToRequest: 0,
            duration: 0
        }
    },

    computed: {
        peerStatus: function () {
            if (!this.nodeInfo) {
                return 'unknown';
            }

            if (this.nodeInfo.latestMilestoneIndex === this.nodeInfo.latestSolidSubtangleMilestoneIndex) {
                return 'synchronous';
            }

            return 'not synchronized';
        }
    },

    methods: {
        addPeer: function (event) {
            var normalizedAddress = this.address.replace(/\s/g, '');

            socket.emit('addPeer', { address: normalizedAddress });
        }
    }
};

var system = new Vue(systemTemplate);
var socket = io();

socket.on('nodeInfo', function (info) {
    system.nodeInfo = info;
});
