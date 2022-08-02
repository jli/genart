-- status 2022-08-01: not in use (disabled in vscode) bc never got tidal-vis working :( but drawLine is decent
--
-- OSCTarget for pattern visualizing.
 patternTarget = OSCTarget { oName = "Pattern handler", oAddress = "127.0.0.1", oPort = 5050, oPath = "/trigger/something", oShape = Nothing, oLatency = 0.02, oPreamble = [], oTimestamp = BundleStamp }

 -- OSCTarget for play music via SuperCollider.
 musicTarget = superdirtTarget { oLatency = 0.1, oAddress = "127.0.0.1", oPort = 57120 }

 config = defaultConfig {cFrameTimespan = 1/20}

 -- Send pattern as osc both to SC and to tidal-vis
 tidal <- startMulti [musicTarget, patternTarget] config

 -- Send pattern as osc to SC only
 -- tidal <- startTidal musicTarget config
