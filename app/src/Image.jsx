export default function Image(props) {
	return (
		<div className="imgCard" onClick={() => {navigator.clipboard.writeText(props.prompt)}}>
			<img width="224" height="336"
				src={"http://localhost:3000/" + props.path.replace('#','%23') + encodeURIComponent(props.filename)}
				loading={props.index <= 60 ? "eager" : "lazy"}
				title={props.path + props.filename}
			/>
			<div className="imgFolder" onClick={() => props.onFolderClick(props.index)}>📁</div>
			<div className="imgDocument" onClick={() => props.onDocumentClick(props.index)}>📄</div>
			<div className="nameplate">
				{props.name || props.filename}
			</div>
		</div>
	)
}