var timeout = null;
var stateSending = false;

function search()
{
	$('#prepareToShare').empty();
    $('#playlistDiv').html("<div class='loading'><div class='throbber'><div></div></div></div>")

    var search = new models.Search(document.getElementById('searchTerm').value);       
    var playlist = new models.Playlist(); 
    search.localResults = models.LOCALSEARCHRESULTS.APPEND;

    search.observe(models.EVENT.CHANGE, function() {

        search.tracks.forEach(function(track) {
            playlist.add(track);
        });

        
		var list = getCommonList(playlist);

        list.node.classList.add('sp-light');

        $('#playlistDiv').empty();
        document.getElementById('playlistDiv').appendChild(list.node);
    });

    search.appendNext();                
}

function stage(trackUri)
{
	var t = models.Track.fromURI(trackUri, function(track) {
			    $("#prepareToShare").html(tmpl("prepareToShare_tmpl", track));
			});

    var link = new models.Link(trackUri);
    $(".artistLink").attr("href", link.uri);

}

function federate(trackUri)
{
    syncConnection = $.connection('http://gooser.azurewebsites.net/gooseSync', "group=123");

    syncConnection.start().done(function() {
        setStateSending(true);
        connection.send(trackUri);

        if (timeout !== null)
        {
            clearInterval(timeout);
        }

        timeout = setInterval(function() {
            if (!player.playing) 
            {
                clearInterval(timeout);
            }

            var positionReport = player.position;
            if (positionReport == null) {
                console.log("loading");
            }
            else
            {
                console.log("sending lead goose position as " + player.position);
                syncConnection.send(player.position);
            }


        }, 5000);
    });
}

function getCommonList(playlist)
{
	return new views.List(playlist, function(track) {
                var trackEx = new views.Track(track,
                                    views.Track.FIELD.NAME |
                                    views.Track.FIELD.STAR |
                                    views.Track.FIELD.ARTIST |
                                    views.Track.FIELD.DURATION);

                $(trackEx.node).append("<span class='sp-right'><button class='add-honk button icon' onclick='stage(\"" + track.uri + "\")'><span class='goose-dark'></span>honk</button></span>");
                return trackEx;
                                            });

}

function handleDataReceived(data)
{
    console.log(data);
    $("#data").html(data);

    var p = player.play(data);

    $('#taildetails').empty();
    $('#taildetails').html("<div class='loading'><div class='throbber'><div></div></div></div>")

    var t1 = models.Track.fromURI(data, function(track) {
                var templated = tmpl("taildetails_tmpl", track);
                $("#taildetails").html(templated);
            });                         

    var link = new models.Link(trackUri);
    $(".artistLink").attr("href", link.uri);
}       

function handleStartUp(){//todo ensure connection is valid before reinstantiation
    connection = $.connection('http://gooser.azurewebsites.net/goose', "group=123");

    connection.start().done(function() {

        $("#data").html("connected");
        connection.received(handleDataReceived);
    }
    );
}

function setStateSending(value)
{
    stateSending = value;

    if (value) {
        $("#sendingInfo").show();
    }
    else {
        $("#sendingInfo").hide();
    }

}