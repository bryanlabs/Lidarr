import ModelBase from 'App/ModelBase';
import Artist, { Image } from 'Artist/Artist';

export interface Statistics {
  trackCount: number;
  trackFileCount: number;
  percentOfTracks: number;
  sizeOnDisk: number;
  totalTrackCount: number;
}

interface Album extends ModelBase {
  artistId: number;
  artist: Artist;
  foreignAlbumId: string;
  title: string;
  overview: string;
  disambiguation?: string;
  albumType: string;
  images: Image[];
  monitored: boolean;
  releaseDate: string;
  statistics: Statistics;
  lastSearchTime?: string;
  isSaving?: boolean;
}

export default Album;
