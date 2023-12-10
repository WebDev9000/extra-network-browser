import { useState, useEffect, useRef, useReducer } from 'react'
import { debounce } from 'lodash'
import axios from 'axios'
import ReactModal from 'react-modal'
import Image from "./Image"

export default function GetImages() {
	const [render, setRender] = useState(false);
	const [images, setImages] = useState([])
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [sort, setSort] = useState('modified')
	const [type, setType] = useState('lora')

	const [renderMore, setRenderMore] = useState(false);
	const [modalIsOpen, setIsOpen] = useState(false)
	const [moreImages, setMoreImages] = useState([])
	const [moreLoading, setMoreLoading] = useState(true)
	const [moreError, setMoreError] = useState(false)
	const [moreIndex, setMoreIndex] = useState(null)
	const [moreDocument, setMoreDocument] = useState(null)

	const inputReference = useRef(null)

	ReactModal.setAppElement('#root')

	const customModalStyle = {
		overlay: {
			backgroundColor: 'rgba(0,0,0,0.97)',
		},
		content: {
			maxHeight: '90%',
			maxWidth: '2545px',
			top: '50%',
			left: '50%',
			right: 'auto',
			bottom: 'auto',
			marginRight: '-50%',
			transform: 'translate(-50%, -50%)',
			backgroundColor: 'rgba(0,0,0,0.25)',
			border: 'none',
		},
	}

	const sortImages = (dataArray) => {
		if (sort == "random") {
			for (let i = dataArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dataArray[i], dataArray[j]] = [dataArray[j], dataArray[i]];
    	}
		} else {
			dataArray.sort(function(a, b){
				if (sort == "modified") {
					return b.mtimeMs - a.mtimeMs
				} else {
					return a.filename - b.filename
				}
			})
		}
		return dataArray
	}

	const fetchImages = () => {
		setLoading(true)
		setMoreLoading(true)
		setImages([])
		setMoreImages([])
		axios.get(`http://localhost:3000/images?type=${type}&search=${searchTerm}`)
			.then(response => {
				if (sort != "name") {
					setImages(sortImages(response.data))
				} else {
					setImages(response.data)
				}
				setLoading(false)
				setError(false)
			})
			.catch(err => {
				console.log(err)
				setLoading(false)
				setError(true)
			})
	}

	const fetchMoreImages = () => {
		setMoreLoading(true)
		setMoreImages([])

		const image = images[moreIndex]
		const query = encodeURIComponent(image.path + image.filename)

		axios.get(`http://localhost:3000/moreImages?search=${query}`)
			.then(response => {
				setMoreLoading(false)
				setMoreError(false)
				if (sort != "name") {
					setMoreImages(sortImages(response.data))
				} else {
					setMoreImages(response.data)
				}
				openModal()
			})
			.catch(err => {
				console.log(err)
				setMoreLoading(false)
				setMoreError(true)
			})
	}

	const handleSearchInputChange = debounce((e) => {
		setSearchTerm(e.target.value)
	}, 500)

	const handleSortChange = (sortOption) => {
		setSort(sortOption)
		// Triggering refresh manually to allow for sorting option reclicks
		setRender(!render)
	}

	const handleTypeChange = (typeOption) => {
		setType(typeOption)
		// Prevent issue with clicking the same image (eg. 3rd) on each tab not loading.
		setMoreIndex(null)
	}

	const openModal = () => {
		setIsOpen(true)
	}

	const closeModal = () => {
		setIsOpen(false)
	}

	const handleFolderClick = (index) => {
		if (moreIndex != null && moreIndex == index && !moreDocument) {
			openModal()
		} else {
			setMoreDocument(null)
			setMoreLoading(true)
			setMoreIndex(index)
			setRenderMore(!renderMore)
			openModal()
		}
	}

	const handleDocumentClick = (index) => {
		setMoreLoading(true)
		setMoreImages([])
		setMoreDocument(null)

		const image = images[index]
		const file = encodeURIComponent(image.filename.substring(0, image.filename.lastIndexOf('.')) + '.txt')

		axios.get(`http://localhost:3000/${image.path}${file}`)
			.then(response => {
				setMoreLoading(false)
				setMoreError(false)
				setMoreDocument(response.data)
				setMoreIndex(index)
				openModal()
			})
			.catch(err => {
				if (err.response.status == "404") {
					setMoreLoading(false)
					setMoreError(false)
					setMoreDocument('No additional information found.')
					setMoreIndex(index)
					openModal()
				} else {
					console.log(err)
					setMoreLoading(false)
					setMoreError(true)
					openModal()
				}
			})
	}

	const handleModalKeys = (event) => {
		event.stopPropagation()
		if (event.key == "ArrowLeft") {
			if (moreIndex > 0) {
				setMoreLoading(true)
				setMoreDocument(null)
				setMoreIndex(moreIndex - 1)
				setRenderMore(!renderMore)
			}
		}	else if (event.key == "ArrowRight") {
			if (moreIndex+1 < images.length) {
				setMoreLoading(true)
				setMoreDocument(null)
				setMoreIndex(moreIndex + 1)
				setRenderMore(!renderMore)
			}
		}	else if (event.key == "ArrowDown") {
			handleDocumentClick(moreIndex)
		} else if (event.key == "ArrowUp") {
			handleFolderClick(moreIndex)
		} else if (event.key == "Escape") {
			closeModal()
		}
	}

	useEffect(() => {
		fetchImages()
	}, [searchTerm, type, render])

	useEffect(() => {
		if (moreIndex != null) {
			fetchMoreImages()
		}
	}, [renderMore])

	return (
		<>
			<div>
				<div id="search">
				<div id="typeOptions">
						<span title="Lora" className={`typeOption ${type == "lora" ? "highlight" : ""}`} onClick={() => handleTypeChange("lora")}>L</span>
						<span title="Style" className={`typeOption ${type == "styles" ? "highlight" : ""}`} onClick={() => handleTypeChange("styles")}>S</span>
						<span title="Embedding" className={`typeOption ${type == "embeddings" ? "highlight" : ""}`} onClick={() => handleTypeChange("embeddings")}>E</span>
						<span title="HyperNetwork" className={`typeOption ${type == "hypernets" ? "highlight" : ""}`} onClick={() => handleTypeChange("hypernets")}>H</span>
						<span title="Checkpoint" className={`typeOption ${type == "checkpoints" ? "highlight" : ""}`} onClick={() => handleTypeChange("checkpoints")}>C</span>
					</div>
					<input id="imgSearch" icon='search' placeholder='Search...'
						onChange={handleSearchInputChange}
					/>
					<div id="sortOptions">
						<span title="Modified" className={`sortOption ${sort == "modified" ? "highlight" : ""}`} onClick={() => handleSortChange("modified")}>M</span>
						<span title="Name" className={`sortOption ${sort == "name" ? "highlight" : ""}`} onClick={() => handleSortChange("name")}>N</span>
						<span title="Random" className={`sortOption ${sort == "random" ? "highlight" : ""}`} onClick={() => handleSortChange("random")}>R</span>
					</div>
				</div>
				<div>
					{loading && <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>}
					{error && <h2>There was an error loading the images.</h2>}
					{!loading && !error && images.map((image, index) => (
						<Image key={index} index={index} {...image} onFolderClick={handleFolderClick} onDocumentClick={handleDocumentClick} />
					))}
				</div>
				<ReactModal
					isOpen={modalIsOpen}
					onAfterOpen={() => { inputReference.current.focus() }}
					onRequestClose={closeModal}
					preventScroll={true}
					style={customModalStyle}
				>
					<div
						ref={inputReference}
						tabIndex="-1" // Enables key handlers on div
						onKeyDown={handleModalKeys}
						className="modalContent"
					>
						{moreLoading && <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>}
						{moreError && <h2>There was an error during loading.</h2>}
						{!moreLoading && !moreError && images[moreIndex] && moreImages[0] && !moreDocument && <div className="modalHeader" style={{width: `calc(224px * ${moreImages.length})`}}>{images[moreIndex].path + images[moreIndex].filename}</div>}
						{!moreLoading && !moreError && images[moreIndex] && moreImages[0] && !moreDocument && moreImages.map((image, index) => (
							<div key={index+1000000} className="imgCard" onClick={() => {navigator.clipboard.writeText(images[moreIndex].prompt)}}>
								<img width="224" height="336"
									src={"http://localhost:3000/" + image.path + encodeURIComponent(image.filename)}
									loading={index <= 60 ? "eager" : "lazy"}
									title={image.filename}
								/>
							</div>
						))}
						{!moreLoading && !moreError && moreDocument && images[moreIndex] &&
							<div className="moreDocument">
								<pre>
									File: {images[moreIndex].filename}{<br />}
									{type != "styles" && `Keywords: ${images[moreIndex].keywords}\n`}
									{type != "styles" && `Weight: ${images[moreIndex].weight}`}
									{type == "styles" && `Prompt: ${images[moreIndex].prompt}`}
								</pre>
								<pre>{moreDocument}</pre>
							</div>
						}
					</div>
				</ReactModal>
			</div>
		</>
	)
}