import React, {useEffect, useState} from "react";
import {Box, Button, ButtonGroup, CardContent, CardMedia, Link, Tooltip, Typography, Dialog, DialogTitle, DialogContent} from "@mui/material";
import DropDownBox from "@/components/DropDownBox";
import MediaTag from "@/pages/movie/search/components/MediaCard/MediaTag";
import Stream from "@/pages/movie/search/components/MediaCard/Stream";
import MediaView from "@/pages/movie/search/components/MediaCard/MediaView";
import {useGetMediaStreams} from "@/api/MediaServerApi";
import message from "@/utils/message";
import styled from "styled-components/macro";
import { useEpisodesDisplay } from './utils';

const TVCard = ({media}) => {
    const {mutateAsync: getMediaStreams, isLoading} = useGetMediaStreams();
    const [selectEpisodeId, setSelectEpisodeId] = useState();
    const [posterUrl, setPosterUrl] = useState();
    const [seasonName, setSeasonName] = useState();
    const [seasons, setSeasons] = useState([]);
    const [episodes, setEpisodes] = useState([]);
    const [audioStreams, setAudioStreams] = useState([]);
    const [subtitleStreams, setSubtitleStreams] = useState([]);
    const [mediaTag, setMediaTag] = useState({codec: '编码', resolution: '分辨率', container: '格式'})
    const [showEpisodeDialog, setShowEpisodeDialog] = useState(false);

    const onSeasonChange = (value) => {
        const season = findSeason(value);
        if (!season) {
            return;
        }
        setMediaInfo(season);
    }
    const setMediaInfo = (season, updateSeasonName = true, updateEpisodesValue = true) => {
        setPosterUrl(season?.poster_url)
        if (updateSeasonName) {
            setSeasonName(`第${season.index}季`);
        }
        setAudioStreams(season.audio_streams)
        setSubtitleStreams(season.subtitle_streams)
        if (updateEpisodesValue) {
            setEpisodes(season.sub_items)
        }
        setMediaTag({
            codec: season.video_codec,
            resolution: season.video_resolution,
            container: season.video_container
        })
    }
    const findSeason = (index) => {
        const ss = media.sub_items.filter((item) => {
            return item.index === index
        });
        if (ss.length > 0) {
            return ss[0];
        } else {
            return null;
        }
    }
    const episodeOnClick = (episode) => {
        if (episode.status === 0) {
            return;
        }
        setSelectEpisodeId(episode.id)
        getMediaStreams({id: episode.id}, {
            onSuccess: resData => {
                const {code, message: msg, data} = resData;
                if (code === 0) {
                    setMediaInfo(data, false, false);
                }
            },
            onError: error => message.error(error)
        });
    }
    useEffect(() => {
        setSeasons(media.sub_items.map((item) => {
            return {
                name: `第${item.index}季`,
                value: item.index
            }
        }))
        setMediaInfo(media.sub_items[media.sub_items.length - 1]);
    }, [media])

    const [calcCount, isOver] = useEpisodesDisplay(episodes);

    const renderEpisodes = (episodes, isShowMoreBtn) => {
        return (
            <ButtonGroup size="small" aria-label="分集" sx= {{ flexWrap: isShowMoreBtn ? 'nowrap' : 'wrap' }}>
                {episodes.map((item, index) => (
                    <Tooltip title={item?.name ? item.name : `第${item.index}集`}>
                        <Button
                            key={index}
                            variant="text"
                            color={item.status === 0 ? "error" : "secondary"}
                            onClick={() => episodeOnClick(item)}
                            disabled={selectEpisodeId && item?.id && selectEpisodeId === item.id}
                        >{item.index}</Button>
                    </Tooltip>
                ))}
                {(isOver && isShowMoreBtn) && <Tooltip title={'点击查看更多'}>
                    <Button
                        key={'more'}
                        variant="text"
                        onClick={() => setShowEpisodeDialog(true)}
                        color={"secondary"}
                    >...</Button>
                </Tooltip>}
            </ButtonGroup>
        )
    }
    

    return (
        <MediaView image={media.backdrop_url}>
            <CardMediaWrapper
                component="img"
                sx={{ borderRadius: '6px', cursor: 'pointer'}}
                image={posterUrl}
                onClick={() => window.open(media.url)}
            />
            <Box sx={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                <CardContent sx={{flex: '1 0 auto'}}>
                    <Typography component="div" variant="h5">
                        <Link target="_blank" sx={{color: '#fff'}}
                              href={media.url}>{seasons && seasons.length === 1 ? `${media.name} ${seasonName}` : media.name}</Link>
                        {seasons && seasons.length > 1 ? <DropDownBox
                            value={seasonName}
                            data={seasons}
                            onChange={onSeasonChange}
                        /> : null}
                    </Typography>
                    {media && media.sub_items && media.sub_items.length > 0 && media.next_episode_to_air && seasonName === `第${media.sub_items[media.sub_items.length - 1].index}季` ?
                        <Typography component="div" variant="subtitle2">
                            第 {media.next_episode_to_air.episode_index} 集播出时间 {media.next_episode_to_air.air_date}
                        </Typography> : null}
                    {episodes && episodes.length > 0 && renderEpisodes(episodes.slice(0, calcCount), true)}
                    <MediaTag video_codec={mediaTag.codec} video_resolution={mediaTag.resolution}
                              video_container={mediaTag.container}/>
                    <Stream title="音频" streams={audioStreams}/>
                    <Stream title="字幕" streams={subtitleStreams}/>
                </CardContent>
            </Box>
            <Dialog onClose={()=>setShowEpisodeDialog(false)} open={showEpisodeDialog}>
                <DialogTitle>剧集列表</DialogTitle>
                <DialogContent>
                    {episodes && episodes.length > 0 && renderEpisodes(episodes, false)}
                </DialogContent>
            </Dialog>
        </MediaView>
    )
}

const CardMediaWrapper = styled(CardMedia)`
    width: 0;
    ${(props) => props.theme.breakpoints.up("sm")} {
        width: 176px;
    }
`;
export default TVCard;