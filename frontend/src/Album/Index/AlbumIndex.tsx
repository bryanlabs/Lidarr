import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppState from 'App/State/AppState';
import Album from 'Album/Album';
import AlbumCover from 'Album/AlbumCover';
import AlbumTitleLink from 'Album/AlbumTitleLink';
import ArtistNameLink from 'Artist/ArtistNameLink';
import LoadingIndicator from 'Components/Loading/LoadingIndicator';
import Link from 'Components/Link/Link';
import PageContent from 'Components/Page/PageContent';
import PageContentBody from 'Components/Page/PageContentBody';
import PageToolbar from 'Components/Page/Toolbar/PageToolbar';
import PageToolbarButton from 'Components/Page/Toolbar/PageToolbarButton';
import PageToolbarSection from 'Components/Page/Toolbar/PageToolbarSection';
import { align, icons } from 'Helpers/Props';
import {
  fetchAlbums,
  setAlbumsSort,
} from 'Store/Actions/albumActions';
import createClientSideCollectionSelector from 'Store/Selectors/createClientSideCollectionSelector';
import getErrorMessage from 'Utilities/Object/getErrorMessage';
import translate from 'Utilities/String/translate';
import AlbumIndexSortMenu from './Menus/AlbumIndexSortMenu';
import styles from './AlbumIndex.css';

const albumCollectionSelector = createClientSideCollectionSelector(
  'albums',
  'albums'
);

function getArtistName(album: Album) {
  return album.artist?.artistName || '';
}

function getAlbumYear(album: Album) {
  return album.releaseDate ? album.releaseDate.slice(0, 4) : '';
}

function getTrackSummary(album: Album) {
  const statistics = album.statistics;

  if (!statistics?.trackCount) {
    return '';
  }

  return `${statistics.trackFileCount || 0}/${statistics.trackCount} tracks`;
}

function hasImportedTracks(album: Album) {
  const statistics = album.statistics;

  return (
    (statistics?.trackFileCount || 0) > 0 ||
    (statistics?.sizeOnDisk || 0) > 0
  );
}

function AlbumCard({ album }: { album: Album }) {
  const artist = album.artist;
  const artistName = getArtistName(album);
  const albumYear = getAlbumYear(album);
  const trackSummary = getTrackSummary(album);

  return (
    <div className={styles.albumCard}>
      <Link className={styles.coverLink} to={`/album/${album.foreignAlbumId}`}>
        <AlbumCover
          className={styles.cover}
          images={album.images || []}
          size={250}
          lazy={true}
        />
      </Link>

      <div className={styles.albumTitle}>
        <AlbumTitleLink
          foreignAlbumId={album.foreignAlbumId}
          title={album.title}
          disambiguation={album.disambiguation}
        />
      </div>

      {artist?.foreignArtistId ? (
        <div className={styles.artistName}>
          <ArtistNameLink
            foreignArtistId={artist.foreignArtistId}
            artistName={artistName}
          />
        </div>
      ) : (
        <div className={styles.artistName}>{artistName}</div>
      )}

      {albumYear || trackSummary ? (
        <div className={styles.metadata}>
          {[albumYear, trackSummary].filter(Boolean).join(' - ')}
        </div>
      ) : null}
    </div>
  );
}

function AlbumIndex() {
  const {
    isFetching,
    isPopulated,
    error,
    items,
    sortKey,
    sortDirection,
  } = useSelector((state: AppState) => albumCollectionSelector(state));
  const dispatch = useDispatch();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const downloadedAlbums = items.filter(hasImportedTracks);
  const hasNoAlbums = !downloadedAlbums.length;

  useEffect(() => {
    dispatch(fetchAlbums());
  }, [dispatch]);

  const onRefreshPress = useCallback(() => {
    dispatch(fetchAlbums());
  }, [dispatch]);

  const onSortSelect = useCallback(
    (value: string) => {
      dispatch(setAlbumsSort({ sortKey: value }));

      if (scrollerRef.current) {
        scrollerRef.current.scrollTo(0, 0);
      }
    },
    [dispatch]
  );

  return (
    <PageContent>
      <PageToolbar>
        <PageToolbarSection>
          <PageToolbarButton
            label={translate('Refresh')}
            iconName={icons.REFRESH}
            isSpinning={isFetching}
            onPress={onRefreshPress}
          />
        </PageToolbarSection>

        <PageToolbarSection alignContent={align.RIGHT} collapseButtons={false}>
          <AlbumIndexSortMenu
            sortKey={sortKey}
            sortDirection={sortDirection}
            isDisabled={hasNoAlbums}
            onSortSelect={onSortSelect}
          />
        </PageToolbarSection>
      </PageToolbar>

      <div className={styles.pageContentBodyWrapper}>
        <PageContentBody
          ref={scrollerRef}
          className={styles.contentBody}
          innerClassName={styles.innerContentBody}
        >
          {isFetching && !isPopulated ? <LoadingIndicator /> : null}

          {!isFetching && !!error ? (
            <div className={styles.errorMessage}>
              {getErrorMessage(error, 'Failed to load albums from API')}
            </div>
          ) : null}

          {!error && isPopulated && !downloadedAlbums.length ? (
            <div className={styles.emptyMessage}>No downloaded albums found</div>
          ) : null}

          {!error && isPopulated && !!downloadedAlbums.length ? (
            <div className={styles.albumGrid}>
              {downloadedAlbums.map((album: Album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          ) : null}
        </PageContentBody>
      </div>
    </PageContent>
  );
}

export default AlbumIndex;
