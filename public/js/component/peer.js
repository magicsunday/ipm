var peerTemplate = `
<div class="col-xl-3 col-lg-6 col-md-6">
    <div class="card mb-3 text-white" v-bind:class="[peerStatus === 'synchronous' ? 'border-success' : 'border-danger']">
        <div class="card-header" v-bind:class="[peerStatus === 'synchronous' ? 'bg-success' : 'bg-danger']">
            <span class="float-left">
                <i class="fa fa-link fa-fw"></i> {{state.connectionType}}://{{state.address}}
            </span>
            <a href="#" class="btn btn-danger btn-sm float-right" v-on:click="removePeer">X</a>
        </div>

        <div class="card-block m-3">
            <canvas :id="id" width="100%" height="180"></canvas>
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
                    <em>{{state.nodeInfo.appVersion}}</em>
                </span>
            </a>
            <a href="#" class="list-group-item list-group-item-action">
                <i class="fa fa-group fa-fw"></i> Neighbors
                <span class="float-right text-muted small">
                    <em>{{state.nodeInfo.neighbors}}</em>
                </span>
            </a>
            <a href="#" class="list-group-item list-group-item-action">
                <i class="fa fa-tasks fa-fw"></i> Latest milestone index
                <span class="float-right text-muted small">
                    <em>{{state.nodeInfo.latestMilestoneIndex}}</em>
                </span>
            </a>
            <a href="#" class="list-group-item list-group-item-action">
                <i class="fa fa-tasks fa-fw"></i> Latest solid milestone index
                <span class="float-right text-muted small">
                    <em>{{state.nodeInfo.latestSolidSubtangleMilestoneIndex}}</em>
                </span>
            </a>

            <a href="#" class="list-group-item list-group-item-action">
                <i class="fa fa-upload fa-fw"></i> Sent transactions
                <span class="float-right text-muted small">
                    <em>{{state.numberOfSentTransactions}}</em>
                </span>
            </a>
            <a href="#" class="list-group-item list-group-item-action">
                <i class="fa fa-download fa-fw"></i> Received transactions
                <span class="float-right text-muted small">
                    <em>{{state.numberOfAllTransactions}}</em>
                </span>
            </a>
            <a href="#" class="list-group-item list-group-item-action">
                <i class="fa fa-download fa-fw"></i> Received new transactions
                <span class="float-right text-muted small">
                    <em>{{state.numberOfNewTransactions}}</em>
                </span>
            </a>
            <a href="#" class="list-group-item list-group-item-action">
                <i class="fa fa-download fa-fw"></i> Received random transaction requests
                <span class="float-right text-muted small">
                    <em>{{state.numberOfRandomTransactionRequests}}</em>
                </span>
            </a>
            <a href="#" class="list-group-item list-group-item-action">
                <i class="fa fa-download fa-fw"></i> Received invalid transactions
                <span class="float-right text-muted small">
                    <em>{{state.numberOfInvalidTransactions}}</em>
                </span>
            </a>
        </div>
    </div>
</div>
`;


//<div class="card-footer small text-muted">
//    Bla Bla
//</div>

//<div class="mb-5 text-secondary">
//    <input class="h5" v-model="state.tag" v-on:keyup.enter="editTag" v-bind:class="[updating ? '' : 'tag-disabled']" :disabled="updating == 1 ? false : true" v-bind:size="state.tag.length">
//    <i aria-hidden="true" v-on:click="editTag" v-bind:class="[updating ? 'fa fa-check float-right' : 'fa fa-pencil float-right']"></i>
//    <div class="text-info text-md"">
//        {{state.connectionType}}://{{state.address}}
//    </div>
//</div>
//

var peer = Vue.component('peer', {

    props: ['state'],
    template: peerTemplate,

    data: function () {
        return {
            updating: false,
            id : this._uid
        };
    },

    computed: {
        peerStatus: function () {
            if (!this.state
                || !this.state.nodeInfo
            ) {
                return 'unknown';
            }

            if (this.isDead()) {
                return 'seems dead';
            }

            if (this.state.nodeInfo.latestMilestoneIndex === this.state.nodeInfo.latestSolidSubtangleMilestoneIndex) {
                return 'synchronous';
            }

            return 'not synchronized';
        }
    },

    mounted () {
        var ctx = document.getElementById(this._uid);

        this.myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Rec TX',
                        data: []
                    },
                    {
                        label: 'New TX',
                        data: []
                    },
                    {
                        label: 'Sent TX',
                        data: []
                    },
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                lineTension: 0,
                scales: {
                    xAxes: [{
                        display: false
                    }]
                },
                legend: {
                    display: true,
                    labels: {
                        boxWidth: 10
                    }
                }
            }
        });
    },

    watch: {
        // Whenever question changes, this function will run
        'state.history': function (newData) {
            Object.assign(this.myChart.data, newData);

            this.myChart.update();
        },

        'state.tag': function (newData, oldData) {
            socket.emit(
                'updateTag',
                {
                    address: this.state.address,
                    tag: newData
                }
            );
        },
    },

    methods: {
        editTag: function (event) {
            this.updating = !this.updating;
        },

        // Check if the peer is dead. This may be the cause if we got
        // no new data since the last 10 updates.
        isDead: function () {
            if (!this.state) {
                return false;
            }

            var data = this.state.history.datasets[0].data;

            if (data.length < 10) {
                return false;
            }

            var data = data.filter(function (entry) {
                return entry !== data[0];
            });

            return !data.length;
        },

        // `this` inside methods points to the Vue instance
        removePeer: function (event) {
            swal({
                title: 'Are you sure?',
                text: 'Removing peer ' +  this.state.connectionType + "://" + this.state.address + '!',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete peer!'
            }).then((result) => {
                if (result.value) {
                    socket.emit(
                        'removePeer',
                        {
                            address: this.state.connectionType + '://' + this.state.address
                        }
                    );

                    swal(
                        'Deleted!',
                        'Your peer has been deleted. Please also update your IRI config file (if required).',
                        'success'
                    );
                }
            });
        }
    }
});
