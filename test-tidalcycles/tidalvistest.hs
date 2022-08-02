import Sound.Tidal.Vis
import qualified Graphics.Rendering.Cairo as C
import Data.Colour
import Data.Colour.Names
import Data.Colour.SRGB
let draw pat = vLines (C.withSVGSurface) "test.svg" (600,200) pat 3 1
